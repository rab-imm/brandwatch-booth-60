-- Phase 3: Template Credit System
-- Add credit cost to templates and update download logic

-- Add credit_cost column to templates
ALTER TABLE public.templates 
ADD COLUMN credit_cost integer DEFAULT 0 NOT NULL;

-- Update existing templates with sample credit costs based on category
UPDATE public.templates 
SET credit_cost = CASE 
  WHEN category = 'employment' THEN 3
  WHEN category = 'commercial' THEN 5
  WHEN category = 'real_estate' THEN 4
  WHEN category = 'corporate' THEN 6
  WHEN category = 'intellectual_property' THEN 7
  ELSE 2
END;

-- Add credit cost to template bundles
ALTER TABLE public.template_bundles 
ADD COLUMN total_credit_cost integer DEFAULT 0 NOT NULL;

-- Create function to check and deduct credits for template download
CREATE OR REPLACE FUNCTION public.deduct_credits_for_template(
  p_template_id UUID,
  p_user_id UUID,
  p_company_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credit_cost INTEGER;
  v_available_credits INTEGER;
  v_is_company_user BOOLEAN;
  v_result jsonb;
BEGIN
  -- Get template credit cost
  SELECT credit_cost INTO v_credit_cost
  FROM public.templates
  WHERE id = p_template_id AND is_active = true;
  
  IF v_credit_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template not found');
  END IF;
  
  -- Check if user is part of a company
  v_is_company_user := p_company_id IS NOT NULL;
  
  -- Check available credits
  IF v_is_company_user THEN
    -- Check company credits
    SELECT (total_credits - used_credits) INTO v_available_credits
    FROM public.companies
    WHERE id = p_company_id;
    
    IF v_available_credits < v_credit_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient company credits');
    END IF;
    
    -- Deduct from company credits
    UPDATE public.companies
    SET used_credits = used_credits + v_credit_cost
    WHERE id = p_company_id;
    
    -- Log transaction
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
      -v_credit_cost,
      'template_download',
      'Template download: ' || (SELECT title FROM public.templates WHERE id = p_template_id),
      jsonb_build_object('template_id', p_template_id)
    );
  ELSE
    -- Check individual user credits
    SELECT (subscription_credits - queries_used) INTO v_available_credits
    FROM public.profiles
    WHERE user_id = p_user_id;
    
    IF v_available_credits < v_credit_cost THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
    
    -- Deduct from user credits
    UPDATE public.profiles
    SET queries_used = queries_used + v_credit_cost
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      metadata
    ) VALUES (
      p_user_id,
      -v_credit_cost,
      'template_download',
      'Template download: ' || (SELECT title FROM public.templates WHERE id = p_template_id),
      jsonb_build_object('template_id', p_template_id)
    );
  END IF;
  
  -- Record the download
  INSERT INTO public.template_downloads (
    template_id,
    user_id,
    company_id,
    price_paid_aed
  ) VALUES (
    p_template_id,
    p_user_id,
    p_company_id,
    0 -- No monetary payment, using credits
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', v_credit_cost,
    'remaining_credits', v_available_credits - v_credit_cost
  );
END;
$$;