-- Create template bundles table
CREATE TABLE IF NOT EXISTS public.template_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create template bundle items table
CREATE TABLE IF NOT EXISTS public.template_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.template_bundles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, template_id)
);

-- Create template promotions table
CREATE TABLE IF NOT EXISTS public.template_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.template_bundles(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL,
  discount_percentage DECIMAL(5,2),
  badge_text TEXT,
  badge_color TEXT DEFAULT 'primary',
  is_featured BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (template_id IS NOT NULL OR bundle_id IS NOT NULL)
);

-- Create system config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default system configurations
INSERT INTO public.system_config (config_key, config_value, description) VALUES
  ('credit_pricing', '{"chat_query": 1, "letter_generation": 5, "pdf_export": 1, "digital_signature": 3, "template_download_paid": 2}', 'Credit costs for various actions'),
  ('revenue_sharing', '{"creator_percentage": 70, "platform_percentage": 30, "minimum_payout_aed": 100, "payout_schedule": "monthly"}', 'Revenue sharing configuration'),
  ('credit_rollover_policy', '{"enabled": true, "max_rollover_percentage": 50, "rollover_expiry_months": 3}', 'Credit rollover policy'),
  ('subscription_tiers', '{"free": {"max_credits": 10, "price_aed": 0}, "basic": {"max_credits": 50, "price_aed": 99}, "pro": {"max_credits": 200, "price_aed": 299}, "enterprise": {"max_credits": 1000, "price_aed": 999}}', 'Subscription tier configurations'),
  ('system_limits', '{"rate_limit_per_minute": 60, "max_file_size_mb": 10, "max_concurrent_requests": 5}', 'System rate limits and quotas')
ON CONFLICT (config_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.template_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template bundles
CREATE POLICY "Everyone can view active bundles" ON public.template_bundles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage all bundles" ON public.template_bundles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for bundle items
CREATE POLICY "Everyone can view bundle items" ON public.template_bundle_items
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage bundle items" ON public.template_bundle_items
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for promotions
CREATE POLICY "Everyone can view active promotions" ON public.template_promotions
  FOR SELECT USING (
    (ends_at IS NULL OR ends_at > now()) AND
    starts_at <= now()
  );

CREATE POLICY "Super admins can manage promotions" ON public.template_promotions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for system config
CREATE POLICY "Super admins can manage system config" ON public.system_config
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_bundles_active ON public.template_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_template_promotions_featured ON public.template_promotions(is_featured);
CREATE INDEX IF NOT EXISTS idx_template_promotions_dates ON public.template_promotions(starts_at, ends_at);