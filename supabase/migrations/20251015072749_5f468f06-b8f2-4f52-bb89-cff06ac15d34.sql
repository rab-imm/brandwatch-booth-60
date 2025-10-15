-- Phase 1.2: Add database constraints for company role consistency

-- Add constraint to ensure individual users have no company, and company users have a company
ALTER TABLE public.profiles ADD CONSTRAINT check_company_role_consistency
  CHECK (
    (user_role = 'individual' AND current_company_id IS NULL) OR
    (user_role IN ('company_staff', 'company_manager', 'company_admin') AND current_company_id IS NOT NULL) OR
    (user_role = 'super_admin')
  );

-- Ensure unique company roles per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_company_roles_unique 
  ON public.user_company_roles(user_id, company_id);