-- Create or update admin user
DO $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'nxblochain@gmail.com'
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    -- User exists, just update the profile to super_admin
    UPDATE public.profiles
    SET 
      user_role = 'super_admin',
      subscription_tier = 'premium',
      subscription_status = 'active',
      full_name = 'NX',
      updated_at = now()
    WHERE user_id = existing_user_id;
  ELSE
    -- User doesn't exist, create new user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'nxblochain@gmail.com',
      crypt('bim12345', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', 'NX'),
      now(),
      now(),
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    -- The handle_new_user trigger will create the profile, but we need to update it to super_admin
    -- Wait a moment for the trigger to execute, then update
    UPDATE public.profiles
    SET 
      user_role = 'super_admin',
      subscription_tier = 'premium',
      subscription_status = 'active',
      updated_at = now()
    WHERE user_id = new_user_id;
  END IF;
END $$;