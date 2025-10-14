-- Add foreign key relationship from user_company_roles to profiles
-- This allows us to join and fetch user profile data when querying company roles

ALTER TABLE public.user_company_roles
ADD CONSTRAINT user_company_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;