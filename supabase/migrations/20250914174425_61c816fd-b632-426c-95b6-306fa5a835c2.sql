-- Create a super admin user for testing purposes
UPDATE profiles 
SET user_role = 'super_admin' 
WHERE email = 'janoon@gmail.com';

-- Create RLS policies with proper syntax  
DROP POLICY IF EXISTS "Super admins can view all billing data" ON billing_transactions;
CREATE POLICY "Super admins can view all billing data" 
ON billing_transactions 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Super admins can view all trial data" ON trial_management;
CREATE POLICY "Super admins can view all trial data" 
ON trial_management 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;  
CREATE POLICY "Super admins can manage all companies" 
ON companies 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "Super admins can view all profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.user_role = 'super_admin'
  )
);