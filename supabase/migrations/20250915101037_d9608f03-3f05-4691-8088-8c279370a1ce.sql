-- Fix infinite recursion in user_company_roles RLS policies
-- Drop existing problematic policies and recreate them properly

DROP POLICY IF EXISTS "Company admins can view their company roles" ON user_company_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON user_company_roles;
DROP POLICY IF EXISTS "Super admins manage user company roles" ON user_company_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_company_roles;

-- Create new policies without recursion
CREATE POLICY "Users can view their own company roles"
ON user_company_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all company roles"
ON user_company_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_role = 'super_admin'
  )
);

CREATE POLICY "Company admins can manage roles in their company"
ON user_company_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.user_role = 'company_admin'
    AND p.current_company_id = user_company_roles.company_id
  )
);

CREATE POLICY "System can insert company roles"
ON user_company_roles FOR INSERT
TO authenticated
WITH CHECK (true);