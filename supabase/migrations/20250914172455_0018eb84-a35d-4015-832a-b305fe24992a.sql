-- Phase 1: Core Billing Infrastructure Database Schema

-- Create billing_transactions table for complete payment history
CREATE TABLE public.billing_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit', 'adjustment')),
  amount_aed DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trial_management table for trial user lifecycle
CREATE TABLE public.trial_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_type TEXT NOT NULL DEFAULT 'standard' CHECK (trial_type IN ('standard', 'extended', 'enterprise')),
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_credits_allocated INTEGER NOT NULL DEFAULT 50,
  trial_credits_used INTEGER NOT NULL DEFAULT 0,
  conversion_target_tier TEXT,
  conversion_completed BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  extension_count INTEGER DEFAULT 0,
  extension_reason TEXT,
  trial_status TEXT NOT NULL DEFAULT 'active' CHECK (trial_status IN ('active', 'expired', 'converted', 'extended')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_support_tickets table
CREATE TABLE public.customer_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES auth.users(id),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('billing', 'technical', 'account', 'feature_request', 'bug_report')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed')),
  resolution_notes TEXT,
  billing_context JSONB DEFAULT '{}',
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_events table for audit trail
CREATE TABLE public.subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'canceled', 'paused', 'resumed', 'upgraded', 'downgraded')),
  old_tier TEXT,
  new_tier TEXT,
  old_status TEXT,
  new_status TEXT,
  proration_amount DECIMAL(10,2),
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triggered_by TEXT CHECK (triggered_by IN ('customer', 'admin', 'system', 'stripe_webhook')),
  admin_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_alerts table for automated notifications
CREATE TABLE public.billing_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('payment_failed', 'trial_expiring', 'usage_threshold', 'subscription_canceled', 'high_risk_customer')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_resolve_at TIMESTAMP WITH TIME ZONE,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trial fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_credits_used INTEGER DEFAULT 0,
ADD COLUMN customer_risk_score INTEGER DEFAULT 0 CHECK (customer_risk_score BETWEEN 0 AND 100),
ADD COLUMN last_payment_failure TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_failure_count INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_transactions
CREATE POLICY "Super admins can manage all billing transactions"
ON public.billing_transactions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.user_role = 'super_admin'
));

CREATE POLICY "Users can view their own billing transactions"
ON public.billing_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policies for trial_management
CREATE POLICY "Super admins can manage all trial data"
ON public.trial_management
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.user_role = 'super_admin'
));

CREATE POLICY "Users can view their own trial data"
ON public.trial_management
FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policies for customer_support_tickets
CREATE POLICY "Super admins can manage all support tickets"
ON public.customer_support_tickets
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.user_role = 'super_admin'
));

CREATE POLICY "Users can manage their own support tickets"
ON public.customer_support_tickets
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for subscription_events
CREATE POLICY "Super admins can view all subscription events"
ON public.subscription_events
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.user_role = 'super_admin'
));

-- Create RLS policies for billing_alerts
CREATE POLICY "Super admins can manage all billing alerts"
ON public.billing_alerts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.user_role = 'super_admin'
));

-- Create indexes for performance
CREATE INDEX idx_billing_transactions_user_id ON public.billing_transactions(user_id);
CREATE INDEX idx_billing_transactions_company_id ON public.billing_transactions(company_id);
CREATE INDEX idx_billing_transactions_stripe_payment_intent ON public.billing_transactions(stripe_payment_intent_id);
CREATE INDEX idx_billing_transactions_created_at ON public.billing_transactions(created_at);

CREATE INDEX idx_trial_management_user_id ON public.trial_management(user_id);
CREATE INDEX idx_trial_management_trial_status ON public.trial_management(trial_status);
CREATE INDEX idx_trial_management_trial_end_date ON public.trial_management(trial_end_date);

CREATE INDEX idx_support_tickets_user_id ON public.customer_support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.customer_support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.customer_support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON public.customer_support_tickets(created_at);

CREATE INDEX idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX idx_subscription_events_stripe_subscription ON public.subscription_events(stripe_subscription_id);
CREATE INDEX idx_subscription_events_created_at ON public.subscription_events(created_at);

CREATE INDEX idx_billing_alerts_user_id ON public.billing_alerts(user_id);
CREATE INDEX idx_billing_alerts_alert_type ON public.billing_alerts(alert_type);
CREATE INDEX idx_billing_alerts_is_resolved ON public.billing_alerts(is_resolved);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_billing_transactions_updated_at
  BEFORE UPDATE ON public.billing_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trial_management_updated_at
  BEFORE UPDATE ON public.trial_management
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.customer_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_alerts_updated_at
  BEFORE UPDATE ON public.billing_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_num TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) FROM customer_support_tickets) + 1;
  ticket_num := 'TICKET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM customer_support_tickets WHERE ticket_number = ticket_num) LOOP
    counter := counter + 1;
    ticket_num := 'TICKET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  END LOOP;
  
  RETURN ticket_num;
END;
$$;

-- Create function to automatically assign ticket numbers
CREATE OR REPLACE FUNCTION public.auto_assign_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assigning ticket numbers
CREATE TRIGGER auto_assign_ticket_number_trigger
  BEFORE INSERT ON public.customer_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_ticket_number();