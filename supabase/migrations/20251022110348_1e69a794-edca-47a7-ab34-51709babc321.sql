-- Phase 1: Critical Security & Credit Fixes
-- Part 1: Credit System Race Conditions & Optimistic Locking

-- Add version column for optimistic locking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Add version column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create trigger to increment version on update
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

-- Add version increment triggers
DROP TRIGGER IF EXISTS profiles_increment_version ON public.profiles;
CREATE TRIGGER profiles_increment_version
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS companies_increment_version ON public.companies;
CREATE TRIGGER companies_increment_version
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

-- Create atomic credit deduction function with advisory locks
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id UUID,
  p_company_id UUID DEFAULT NULL,
  p_credits_needed INTEGER DEFAULT 1,
  p_feature TEXT DEFAULT 'query',
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_key BIGINT;
  v_available_credits INTEGER;
  v_queries_used INTEGER;
  v_max_credits INTEGER;
  v_rollover_credits INTEGER;
  v_company_available INTEGER;
  v_profile_version INTEGER;
  v_company_version INTEGER;
BEGIN
  -- Generate lock key based on user_id (convert UUID to bigint)
  v_lock_key := ('x' || substring(p_user_id::text, 1, 15))::bit(60)::bigint;
  
  -- Acquire advisory lock (waits until available, prevents race conditions)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Check if this is a company user
  IF p_company_id IS NOT NULL THEN
    -- Check company credits first
    SELECT total_credits - used_credits, version
    INTO v_company_available, v_company_version
    FROM public.companies
    WHERE id = p_company_id
    FOR UPDATE; -- Lock the row
    
    IF v_company_available < p_credits_needed THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'insufficient_company_credits',
        'available', v_company_available,
        'needed', p_credits_needed
      );
    END IF;
    
    -- Deduct from company credits with optimistic locking check
    UPDATE public.companies
    SET used_credits = used_credits + p_credits_needed
    WHERE id = p_company_id 
      AND version = v_company_version;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'concurrent_modification',
        'message', 'Company credits were modified by another transaction'
      );
    END IF;
    
    -- Log company credit transaction
    INSERT INTO public.credit_transactions (
      company_id,
      user_id,
      amount,
      transaction_type,
      description,
      metadata
    ) VALUES (
      p_company_id,
      p_user_id,
      -p_credits_needed,
      p_feature,
      COALESCE(p_description, format('Credit deduction for %s', p_feature)),
      jsonb_build_object(
        'timestamp', now(),
        'lock_acquired', true
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'credits_deducted', p_credits_needed,
      'remaining_credits', v_company_available - p_credits_needed,
      'source', 'company_pool'
    );
  ELSE
    -- Individual user credit check
    SELECT 
      queries_used, 
      max_credits_per_period,
      COALESCE(rollover_credits, 0),
      version
    INTO 
      v_queries_used,
      v_max_credits,
      v_rollover_credits,
      v_profile_version
    FROM public.profiles
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row
    
    -- Calculate available credits (including rollover)
    v_available_credits := (v_max_credits - v_queries_used) + v_rollover_credits;
    
    IF v_available_credits < p_credits_needed THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'insufficient_credits',
        'available', v_available_credits,
        'needed', p_credits_needed
      );
    END IF;
    
    -- Deduct from regular credits first, then rollover
    IF (v_max_credits - v_queries_used) >= p_credits_needed THEN
      -- Deduct from regular credits with optimistic locking
      UPDATE public.profiles
      SET queries_used = queries_used + p_credits_needed
      WHERE user_id = p_user_id
        AND version = v_profile_version;
    ELSE
      -- Need to use some rollover credits
      DECLARE
        v_regular_used INTEGER := v_max_credits - v_queries_used;
        v_rollover_used INTEGER := p_credits_needed - v_regular_used;
      BEGIN
        UPDATE public.profiles
        SET 
          queries_used = queries_used + v_regular_used,
          rollover_credits = rollover_credits - v_rollover_used
        WHERE user_id = p_user_id
          AND version = v_profile_version;
      END;
    END IF;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'concurrent_modification',
        'message', 'User credits were modified by another transaction'
      );
    END IF;
    
    -- Log individual credit transaction
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      metadata
    ) VALUES (
      p_user_id,
      -p_credits_needed,
      p_feature,
      COALESCE(p_description, format('Credit deduction for %s', p_feature)),
      jsonb_build_object(
        'timestamp', now(),
        'lock_acquired', true,
        'rollover_used', v_rollover_credits < (COALESCE((SELECT rollover_credits FROM profiles WHERE user_id = p_user_id), 0))
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'credits_deducted', p_credits_needed,
      'remaining_credits', v_available_credits - p_credits_needed,
      'source', 'individual'
    );
  END IF;
END;
$$;

-- Create function to clean up expired rollover credits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rollover_credits()
RETURNS TABLE(cleaned_user_id UUID, expired_credits INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.profiles
  SET 
    rollover_credits = 0,
    rollover_expires_at = NULL
  WHERE 
    rollover_expires_at < now()
    AND rollover_credits > 0
  RETURNING user_id, rollover_credits;
  
  -- Log cleanup action
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    metadata
  )
  SELECT 
    user_id,
    -rollover_credits,
    'rollover_expired',
    'Rollover credits expired',
    jsonb_build_object('expired_at', now())
  FROM public.profiles
  WHERE rollover_expires_at < now() AND rollover_credits > 0;
END;
$$;

-- Part 2: Signature Access Token Expiry
ALTER TABLE public.signature_recipients 
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours');

-- Add token used flag to prevent reuse
ALTER TABLE public.signature_recipients
ADD COLUMN IF NOT EXISTS access_token_used BOOLEAN DEFAULT false;

-- Update existing tokens to have 24-hour expiry
UPDATE public.signature_recipients 
SET access_token_expires_at = created_at + interval '24 hours'
WHERE access_token_expires_at IS NULL;

-- Update the is_valid_signature_recipient function to check expiry
CREATE OR REPLACE FUNCTION public.is_valid_signature_recipient(_letter_id uuid, _access_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM signature_recipients sr
    JOIN signature_requests req ON req.id = sr.signature_request_id
    WHERE req.letter_id = _letter_id
      AND sr.access_token = _access_token
      AND sr.status != 'declined'
      AND sr.access_token_used = false
      AND sr.access_token_expires_at > now()
      AND (req.expires_at IS NULL OR req.expires_at > now())
  )
$$;

-- Part 3: Password Reset Rate Limiting
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_time 
ON public.password_reset_attempts (email, attempted_at DESC);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_last_hour INTEGER;
  v_attempts_last_day INTEGER;
BEGIN
  -- Count attempts in last hour
  SELECT COUNT(*)
  INTO v_attempts_last_hour
  FROM public.password_reset_attempts
  WHERE email = p_email
    AND attempted_at > now() - interval '1 hour';
  
  -- Count attempts in last 24 hours
  SELECT COUNT(*)
  INTO v_attempts_last_day
  FROM public.password_reset_attempts
  WHERE email = p_email
    AND attempted_at > now() - interval '24 hours';
  
  -- Rate limits: 5 per hour, 10 per day
  IF v_attempts_last_hour >= 5 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_attempts_hourly',
      'retry_after', '1 hour',
      'attempts', v_attempts_last_hour
    );
  END IF;
  
  IF v_attempts_last_day >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_attempts_daily',
      'retry_after', '24 hours',
      'attempts', v_attempts_last_day
    );
  END IF;
  
  -- Log the attempt
  INSERT INTO public.password_reset_attempts (email, ip_address)
  VALUES (p_email, p_ip_address);
  
  RETURN jsonb_build_object(
    'allowed', true,
    'attempts_remaining_hour', 5 - v_attempts_last_hour - 1,
    'attempts_remaining_day', 10 - v_attempts_last_day - 1
  );
END;
$$;

-- Cleanup old password reset attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_password_reset_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE attempted_at < now() - interval '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;