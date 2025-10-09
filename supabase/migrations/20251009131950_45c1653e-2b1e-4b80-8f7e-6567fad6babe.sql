-- Phase 2: Tiered Subscription Plans - Create 6-tier structure

-- Clear existing subscription tiers to start fresh
TRUNCATE TABLE public.subscription_tiers CASCADE;

-- Insert Individual Plans
INSERT INTO public.subscription_tiers (
  name,
  display_name,
  description,
  price_monthly_aed,
  price_yearly_aed,
  credits_per_month,
  features,
  stripe_product_id,
  stripe_price_id_monthly,
  is_active,
  sort_order
) VALUES
(
  'free',
  'Free',
  'Perfect for trying out Legal Assist',
  0,
  0,
  10,
  '["10 AI legal queries per month", "Access to 1 basic template", "View-only citation access", "Limited Smart Alerts", "Community support"]'::jsonb,
  NULL,
  NULL,
  true,
  1
),
(
  'essential',
  'Essential',
  'For residents and expats needing regular legal assistance',
  39,
  390,
  50,
  '["50 credits per month", "Full access to basic & advanced templates", "Complete citation database access", "Priority email support", "Smart legal alerts", "Download templates"]'::jsonb,
  'prod_TCj9KC5iDS4ljK',
  'price_1SGJgnHsYn1ibhUiFrDZFluE',
  true,
  2
),
(
  'premium',
  'Premium',
  'For power users and families with complex legal needs',
  99,
  990,
  160,
  '["160 credits per month", "Credit rollover enabled", "All templates included", "Priority 24/7 support", "Advanced Smart Alerts", "AI-custom template generation", "Legal update notifications", "Priority response time"]'::jsonb,
  'prod_TCjBniJ0iFISOp',
  'price_1SGJimHsYn1ibhUi2GpS6PjB',
  true,
  3
);

-- Insert Business Plans
INSERT INTO public.subscription_tiers (
  name,
  display_name,
  description,
  price_monthly_aed,
  price_yearly_aed,
  credits_per_month,
  features,
  stripe_product_id,
  stripe_price_id_monthly,
  is_active,
  sort_order
) VALUES
(
  'essential_business',
  'Essential Business',
  'For small law firms and legal departments',
  449,
  4490,
  1000,
  '["1,000 shared credits per month", "Credit rollover for all team members", "Company admin dashboard", "Team member management", "Usage analytics", "Bulk template downloads", "Shared template library", "Email support"]'::jsonb,
  'prod_TCjCRT8OYClyEP',
  'price_1SGJkHHsYn1ibhUiyLRuQkGr',
  true,
  4
),
(
  'premium_business',
  'Premium Business',
  'For medium-sized firms with advanced needs',
  999,
  9990,
  2500,
  '["2,500 shared credits per month", "Credit rollover enabled", "Advanced team management", "Department structure support", "Advanced analytics & reporting", "API access", "Custom template creation", "Priority 24/7 support", "Dedicated account manager"]'::jsonb,
  'prod_TCjCEmOYKxKv4h',
  'price_1SGJkYHsYn1ibhUi65PhhoN2',
  true,
  5
),
(
  'enterprise',
  'Enterprise',
  'Custom solutions for large organizations',
  0,
  0,
  0,
  '["Custom credit allocation", "Unlimited team members", "Custom integrations", "White-label options", "Custom template development", "Dedicated legal research team", "SLA guarantees", "On-premise deployment option", "Custom training & onboarding", "Dedicated success manager"]'::jsonb,
  NULL,
  NULL,
  true,
  6
);

-- Update existing users on old plans to map to new tiers
UPDATE public.profiles
SET subscription_tier = 'essential'
WHERE subscription_tier IN ('essential', 'basic')
  AND user_role = 'individual';

UPDATE public.profiles
SET subscription_tier = 'premium'
WHERE subscription_tier IN ('premium', 'pro')
  AND user_role = 'individual';

UPDATE public.profiles
SET subscription_tier = 'essential_business'
WHERE subscription_tier IN ('sme', 'business')
  AND user_role IN ('company_admin', 'company_manager', 'company_staff');

-- Enable credit rollover for Premium individual and all business plans
UPDATE public.profiles
SET credit_rollover_enabled = true
WHERE subscription_tier IN ('premium', 'essential_business', 'premium_business', 'enterprise');