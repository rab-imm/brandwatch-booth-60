-- Phase 1: Credit System Foundation - Add rollover support

-- Add credit rollover fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credit_rollover_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rollover_credits integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.credit_rollover_enabled IS 'Enable credit rollover for Premium individual and all business plans';
COMMENT ON COLUMN public.profiles.rollover_credits IS 'Credits carried over from previous billing period';

-- Add index for rollover queries
CREATE INDEX IF NOT EXISTS idx_profiles_rollover_enabled 
ON public.profiles(credit_rollover_enabled) 
WHERE credit_rollover_enabled = true;

-- Update existing Premium individual users to enable rollover
UPDATE public.profiles
SET credit_rollover_enabled = true
WHERE subscription_tier = 'premium' AND user_role = 'individual';

-- Update all company users to enable rollover
UPDATE public.profiles
SET credit_rollover_enabled = true
WHERE user_role IN ('company_admin', 'company_manager', 'company_staff');