-- Create a super admin user for testing purposes
UPDATE profiles 
SET user_role = 'super_admin' 
WHERE email = 'janoon@gmail.com';

-- Ensure all billing tables have proper RLS policies for super admins
CREATE POLICY IF NOT EXISTS "Super admins can view all billing data" 
ON billing_transactions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY IF NOT EXISTS "Super admins can view all trial data" 
ON trial_management 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY IF NOT EXISTS "Super admins can view all subscription events" 
ON subscription_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Ensure companies can be managed by super admins
CREATE POLICY IF NOT EXISTS "Super admins can manage all companies" 
ON companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

-- Ensure user_company_roles can be managed by super admins  
CREATE POLICY IF NOT EXISTS "Super admins can manage all user company roles" 
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
CREATE POLICY IF NOT EXISTS "Super admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.user_role = 'super_admin'
  )
);