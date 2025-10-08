-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'rollover')),
  description TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view company credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles
      WHERE user_id = auth.uid() 
        AND company_id = credit_transactions.company_id
        AND role = 'company_admin'::user_role
    )
  );

CREATE POLICY "Super admins can manage all credit transactions"
  ON public.credit_transactions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_company_id ON public.credit_transactions(company_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Create subscription_tiers table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly_aed NUMERIC NOT NULL DEFAULT 0,
  price_yearly_aed NUMERIC NOT NULL DEFAULT 0,
  credits_per_month INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active subscription tiers"
  ON public.subscription_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage subscription tiers"
  ON public.subscription_tiers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_subscription_tiers_active ON public.subscription_tiers(is_active, sort_order);

-- Create admin_custom_reports table
CREATE TABLE public.admin_custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('revenue', 'users', 'usage', 'custom')),
  metrics JSONB DEFAULT '[]'::jsonb NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  chart_type TEXT DEFAULT 'line' CHECK (chart_type IN ('line', 'bar', 'pie', 'area', 'table')),
  date_range TEXT,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  recipients JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage custom reports"
  ON public.admin_custom_reports FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_admin_custom_reports_created_by ON public.admin_custom_reports(created_by);
CREATE INDEX idx_admin_custom_reports_active ON public.admin_custom_reports(is_active);

-- Create admin_impersonation_logs table
CREATE TABLE public.admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  actions_performed JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage impersonation logs"
  ON public.admin_impersonation_logs FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_admin_impersonation_logs_admin ON public.admin_impersonation_logs(admin_user_id);
CREATE INDEX idx_admin_impersonation_logs_target ON public.admin_impersonation_logs(target_user_id);
CREATE INDEX idx_admin_impersonation_logs_started ON public.admin_impersonation_logs(started_at DESC);

-- Create creator_payouts table
CREATE TABLE public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_revenue_aed NUMERIC NOT NULL DEFAULT 0,
  creator_share_aed NUMERIC NOT NULL DEFAULT 0,
  platform_fee_aed NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own payouts"
  ON public.creator_payouts FOR SELECT
  USING (auth.uid() = creator_user_id);

CREATE POLICY "Super admins can manage all payouts"
  ON public.creator_payouts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_creator_payouts_creator ON public.creator_payouts(creator_user_id);
CREATE INDEX idx_creator_payouts_status ON public.creator_payouts(status);
CREATE INDEX idx_creator_payouts_period ON public.creator_payouts(payout_period_start, payout_period_end);

-- Create template_versions table
CREATE TABLE public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(template_id, version_number)
);

ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published template versions"
  ON public.template_versions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Template creators can manage their template versions"
  ON public.template_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_versions.template_id
        AND templates.created_by = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all template versions"
  ON public.template_versions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE INDEX idx_template_versions_template ON public.template_versions(template_id, version_number DESC);
CREATE INDEX idx_template_versions_published ON public.template_versions(is_published);

-- Add triggers for updated_at
CREATE TRIGGER update_credit_transactions_updated_at
  BEFORE UPDATE ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_custom_reports_updated_at
  BEFORE UPDATE ON public.admin_custom_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_payouts_updated_at
  BEFORE UPDATE ON public.creator_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();