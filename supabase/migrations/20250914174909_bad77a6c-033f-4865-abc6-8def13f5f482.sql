-- Create webhook management tables
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID REFERENCES public.webhook_configurations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create retention campaign tables
CREATE TABLE public.retention_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  target_criteria JSONB NOT NULL DEFAULT '{}',
  message_template TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.retention_campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.retention_campaigns(id) ON DELETE CASCADE,
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  converted_count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.churn_risk_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB NOT NULL DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE,
  prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'at_risk',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_risk_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for super admins
CREATE POLICY "Super admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage webhook events" 
ON public.webhook_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage retention campaigns" 
ON public.retention_campaigns 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage retention metrics" 
ON public.retention_campaign_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage churn risk data" 
ON public.churn_risk_customers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_webhook_configurations_updated_at
BEFORE UPDATE ON public.webhook_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retention_campaigns_updated_at
BEFORE UPDATE ON public.retention_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_churn_risk_customers_updated_at
BEFORE UPDATE ON public.churn_risk_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.webhook_configurations (event_type, endpoint_url, enabled) VALUES
('subscription.created', 'https://api.example.com/webhooks/subscription-created', true),
('subscription.cancelled', 'https://api.example.com/webhooks/subscription-cancelled', true),
('payment.succeeded', 'https://api.example.com/webhooks/payment-succeeded', false);

INSERT INTO public.webhook_events (webhook_config_id, event_type, status, retry_count, response_code, payload) 
SELECT 
  id, 
  event_type, 
  CASE WHEN random() > 0.8 THEN 'failed' ELSE 'success' END,
  CASE WHEN random() > 0.8 THEN floor(random() * 3)::int ELSE 0 END,
  CASE WHEN random() > 0.8 THEN 500 ELSE 200 END,
  '{"test": "data"}'::jsonb
FROM public.webhook_configurations;

INSERT INTO public.retention_campaigns (name, campaign_type, status, target_criteria) VALUES
('Win Back Campaign', 'email', 'active', '{"days_inactive": 30}'),
('Premium Upgrade', 'email', 'active', '{"tier": "free", "usage_high": true}'),
('Onboarding Follow-up', 'email', 'paused', '{"days_since_signup": 7}');

INSERT INTO public.retention_campaign_metrics (campaign_id, sent_count, opened_count, clicked_count, converted_count)
SELECT 
  id,
  floor(random() * 1000 + 100)::int,
  floor(random() * 300 + 50)::int,
  floor(random() * 100 + 10)::int,
  floor(random() * 50 + 5)::int
FROM public.retention_campaigns;

INSERT INTO public.churn_risk_customers (user_id, risk_score, risk_factors, last_activity, status)
SELECT 
  user_id,
  floor(random() * 40 + 60)::int,
  '{"low_usage": true, "payment_issues": false}'::jsonb,
  now() - (random() * interval '30 days'),
  'at_risk'
FROM profiles 
LIMIT 5;