-- Create sample companies and user company roles for testing

-- Insert a sample company
INSERT INTO public.companies (
  name, 
  email, 
  subscription_tier, 
  subscription_status, 
  total_credits, 
  used_credits
) VALUES (
  'Acme Legal Corp', 
  'admin@acmelegal.com', 
  'premium', 
  'active', 
  1000, 
  150
);

-- Update an existing user to be a company admin (using the first user if exists)
DO $$
DECLARE 
  sample_user_id UUID;
  sample_company_id UUID;
BEGIN
  -- Get the first user ID
  SELECT user_id INTO sample_user_id FROM public.profiles LIMIT 1;
  -- Get the company we just created
  SELECT id INTO sample_company_id FROM public.companies WHERE name = 'Acme Legal Corp';
  
  IF sample_user_id IS NOT NULL AND sample_company_id IS NOT NULL THEN
    -- Update the user's role to company_admin
    UPDATE public.profiles 
    SET user_role = 'company_admin'::user_role,
        current_company_id = sample_company_id
    WHERE user_id = sample_user_id;
    
    -- Create user_company_role entry
    INSERT INTO public.user_company_roles (
      user_id,
      company_id,
      role,
      max_credits_per_period,
      used_credits
    ) VALUES (
      sample_user_id,
      sample_company_id,
      'company_admin'::user_role,
      200,
      25
    );
  END IF;
END $$;