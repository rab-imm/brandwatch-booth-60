-- Create a super admin user for testing purposes
UPDATE profiles 
SET user_role = 'super_admin' 
WHERE email = 'janoon@gmail.com';

-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Super admins can view all billing data" ON billing_transactions;
DROP POLICY IF EXISTS "Super admins can view all trial data" ON trial_management;
DROP POLICY IF EXISTS "Super admins can view all subscription events" ON subscription_events;
DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;
DROP POLICY IF EXISTS "Super admins can manage all user company roles" ON user_company_roles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Create new RLS policies for super admins on billing_transactions
CREATE POLICY "Super admins manage billing transactions" 
ON billing_transactions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Create new RLS policies for super admins on trial_management
CREATE POLICY "Super admins manage trial data" 
ON trial_management 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Create new RLS policies for super admins on subscription_events
CREATE POLICY "Super admins manage subscription events" 
ON subscription_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Create new RLS policies for super admins on companies
CREATE POLICY "Super admins manage companies" 
ON companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Create new RLS policies for super admins on user_company_roles
CREATE POLICY "Super admins manage user company roles" 
ON user_company_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Allow super admins to view all profiles
CREATE POLICY "Super admins view all profiles" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.user_role = 'super_admin'
  )
);