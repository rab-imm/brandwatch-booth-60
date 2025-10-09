-- Phase 6: Credit Rollover & Expiry System (Update existing columns)
-- Check and add only missing columns

-- Only add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'rollover_expires_at') THEN
    ALTER TABLE public.profiles ADD COLUMN rollover_expires_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'credit_rollover_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN credit_rollover_enabled boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update existing profiles to enable rollover for premium tiers
UPDATE public.profiles 
SET credit_rollover_enabled = true
WHERE subscription_tier IN ('premium', 'essential_business', 'premium_business', 'enterprise')
  AND NOT credit_rollover_enabled;

-- Create function to handle monthly credit reset with rollover
CREATE OR REPLACE FUNCTION public.process_monthly_credit_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  current_tier_limit INTEGER;
  unused_credits INTEGER;
  max_rollover INTEGER;
BEGIN
  FOR profile_record IN 
    SELECT user_id, subscription_tier, queries_used, rollover_credits, 
           credit_rollover_enabled, queries_reset_date
    FROM public.profiles
    WHERE queries_reset_date <= now()
  LOOP
    current_tier_limit := CASE profile_record.subscription_tier
      WHEN 'free' THEN 10
      WHEN 'essential' THEN 100
      WHEN 'premium' THEN 500
      WHEN 'essential_business' THEN 1500
      WHEN 'premium_business' THEN 2500
      WHEN 'enterprise' THEN 10000
      ELSE 10
    END;
    
    unused_credits := GREATEST(0, current_tier_limit - profile_record.queries_used);
    
    IF profile_record.credit_rollover_enabled AND unused_credits > 0 THEN
      max_rollover := current_tier_limit / 2;
      
      UPDATE public.profiles
      SET 
        rollover_credits = LEAST(
          COALESCE(profile_record.rollover_credits, 0) + unused_credits,
          max_rollover
        ),
        rollover_expires_at = now() + interval '90 days',
        queries_used = 0,
        queries_reset_date = date_trunc('month', now() + interval '1 month')
      WHERE user_id = profile_record.user_id;
      
      INSERT INTO public.notifications (user_id, title, message, type, expires_at)
      VALUES (
        profile_record.user_id,
        'Credits Rolled Over',
        format('You have %s rollover credits available, expiring in 90 days.', 
               LEAST(COALESCE(profile_record.rollover_credits, 0) + unused_credits, max_rollover)),
        'info',
        now() + interval '7 days'
      );
    ELSE
      UPDATE public.profiles
      SET queries_used = 0, queries_reset_date = date_trunc('month', now() + interval '1 month')
      WHERE user_id = profile_record.user_id;
    END IF;
  END LOOP;
END;
$$;

-- Create notification and expiry functions
CREATE OR REPLACE FUNCTION public.notify_expiring_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, expires_at)
  SELECT 
    user_id,
    'Rollover Credits Expiring Soon',
    format('You have %s rollover credits expiring on %s. Use them before they expire!',
           rollover_credits,
           to_char(rollover_expires_at, 'Month DD, YYYY')),
    'warning',
    '/analytics',
    rollover_expires_at
  FROM public.profiles
  WHERE rollover_credits > 0
    AND rollover_expires_at IS NOT NULL
    AND rollover_expires_at BETWEEN now() AND now() + interval '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_rollover_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET rollover_credits = 0, rollover_expires_at = NULL
  WHERE rollover_expires_at < now() AND rollover_credits > 0;
END;
$$;