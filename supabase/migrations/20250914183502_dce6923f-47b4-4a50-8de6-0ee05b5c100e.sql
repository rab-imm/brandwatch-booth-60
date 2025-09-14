-- Enhanced user signup trigger to handle company creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  company_id_var UUID;
  company_name_var TEXT;
  signup_type_var TEXT;
BEGIN
  -- Extract signup metadata
  signup_type_var := NEW.raw_user_meta_data ->> 'signup_type';
  company_name_var := NEW.raw_user_meta_data ->> 'company_name';
  
  -- Create profile for user
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
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