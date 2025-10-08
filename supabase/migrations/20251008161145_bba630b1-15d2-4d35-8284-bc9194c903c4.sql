-- Phase 1: Create proper roles system with security definer function

-- Step 1: Create user_roles table for ALL users (not just company users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing data from profiles.user_role to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, user_role 
FROM public.profiles
WHERE user_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'company_admin' THEN 2
      WHEN 'company_manager' THEN 3
      WHEN 'company_staff' THEN 4
      WHEN 'individual' THEN 5
    END
  LIMIT 1
$$;

-- Step 5: Update RLS policies on user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 6: Update profiles RLS policies to use security definer function
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Step 7: Update companies RLS policies
DROP POLICY IF EXISTS "Super admins can manage all companies" ON public.companies;
CREATE POLICY "Super admins can manage all companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;

CREATE POLICY "Super admins insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Step 8: Update user_company_roles RLS policies
DROP POLICY IF EXISTS "Super admins can manage all company roles" ON public.user_company_roles;
CREATE POLICY "Super admins can manage all company roles"
ON public.user_company_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Company admins can manage roles in their company" ON public.user_company_roles;
CREATE POLICY "Company admins can manage roles in their company"
ON public.user_company_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.current_company_id = user_company_roles.company_id
      AND public.has_role(auth.uid(), 'company_admin')
  )
);

-- Step 9: Update other RLS policies to use has_role function
DROP POLICY IF EXISTS "Super admins can manage all documents" ON public.documents;
CREATE POLICY "Super admins can manage all documents"
ON public.documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all templates" ON public.templates;
CREATE POLICY "Super admins can manage all templates"
ON public.templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all revenue shares" ON public.revenue_shares;
CREATE POLICY "Super admins can manage all revenue shares"
ON public.revenue_shares
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Super admins can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all billing transactions" ON public.billing_transactions;
DROP POLICY IF EXISTS "Super admins can view all billing data" ON public.billing_transactions;
DROP POLICY IF EXISTS "Super admins manage billing transactions" ON public.billing_transactions;

CREATE POLICY "Super admins can manage all billing transactions"
ON public.billing_transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all billing alerts" ON public.billing_alerts;
CREATE POLICY "Super admins can manage all billing alerts"
ON public.billing_alerts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage retention campaigns" ON public.retention_campaigns;
CREATE POLICY "Super admins can manage retention campaigns"
ON public.retention_campaigns
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage retention metrics" ON public.retention_campaign_metrics;
CREATE POLICY "Super admins can manage retention metrics"
ON public.retention_campaign_metrics
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage churn risk data" ON public.churn_risk_customers;
CREATE POLICY "Super admins can manage churn risk data"
ON public.churn_risk_customers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage webhook configurations" ON public.webhook_configurations;
CREATE POLICY "Super admins can manage webhook configurations"
ON public.webhook_configurations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage webhook events" ON public.webhook_events;
CREATE POLICY "Super admins can manage webhook events"
ON public.webhook_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all lawyer requests" ON public.lawyer_requests;
CREATE POLICY "Super admins can manage all lawyer requests"
ON public.lawyer_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all support tickets" ON public.customer_support_tickets;
CREATE POLICY "Super admins can manage all support tickets"
ON public.customer_support_tickets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage all trial data" ON public.trial_management;
DROP POLICY IF EXISTS "Super admins can view all trial data" ON public.trial_management;
DROP POLICY IF EXISTS "Super admins manage trial data" ON public.trial_management;

CREATE POLICY "Super admins can manage all trial data"
ON public.trial_management
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage subscription events" ON public.subscription_events;
CREATE POLICY "Super admins can manage subscription events"
ON public.subscription_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Company admins can manage their company invitations" ON public.invitation_tokens;
CREATE POLICY "Company admins can manage their company invitations"
ON public.invitation_tokens
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.current_company_id = invitation_tokens.company_id
      AND public.has_role(auth.uid(), 'company_admin')
  )
);

DROP POLICY IF EXISTS "Super admins can manage all invitations" ON public.invitation_tokens;
CREATE POLICY "Super admins can manage all invitations"
ON public.invitation_tokens
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Step 10: Update handle_new_user trigger to insert into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_id_var UUID;
  company_name_var TEXT;
  signup_type_var TEXT;
  user_role_var user_role;
BEGIN
  -- Extract signup metadata
  signup_type_var := NEW.raw_user_meta_data ->> 'signup_type';
  company_name_var := NEW.raw_user_meta_data ->> 'company_name';
  
  -- Determine user role
  IF signup_type_var = 'company' AND company_name_var IS NOT NULL THEN
    user_role_var := 'company_admin'::user_role;
  ELSE
    user_role_var := 'individual'::user_role;
  END IF;
  
  -- Create profile for user
  INSERT INTO public.profiles (user_id, email, full_name, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    user_role_var
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_var)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If this is a company signup, create company and assign admin role
  IF signup_type_var = 'company' AND company_name_var IS NOT NULL THEN
    -- Create the company
    INSERT INTO public.companies (name, email)
    VALUES (company_name_var, NEW.email)
    RETURNING id INTO company_id_var;
    
    -- Update user profile with company admin role and link to company
    UPDATE public.profiles 
    SET 
      user_role = 'company_admin'::user_role,
      current_company_id = company_id_var
    WHERE user_id = NEW.id;
    
    -- Create user-company role relationship
    INSERT INTO public.user_company_roles (user_id, company_id, role, max_credits_per_period)
    VALUES (NEW.id, company_id_var, 'company_admin'::user_role, 1000);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 11: Add trigger to keep user_roles in sync when profiles.user_role changes
CREATE OR REPLACE FUNCTION public.sync_user_role_on_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_role changed, update user_roles table
  IF NEW.user_role IS DISTINCT FROM OLD.user_role THEN
    -- Remove old role
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = OLD.user_role;
    
    -- Add new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.profiles;
CREATE TRIGGER sync_user_role_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.user_role IS DISTINCT FROM OLD.user_role)
EXECUTE FUNCTION public.sync_user_role_on_profile_update();

-- Step 12: Add updated_at trigger to user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();