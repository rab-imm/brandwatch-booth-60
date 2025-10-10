-- Fix user_id mismatch for nxblochain@gmail.com profile
-- This updates the profile's user_id to match the actual auth.users id

DO $$
DECLARE
  auth_user_id uuid;
  profile_id uuid;
BEGIN
  -- Find the auth user ID for this email
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'nxblochain@gmail.com';
  
  -- Find the profile ID
  SELECT id INTO profile_id
  FROM public.profiles
  WHERE email = 'nxblochain@gmail.com';
  
  -- Update the profile's user_id to match the auth user
  IF auth_user_id IS NOT NULL AND profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET user_id = auth_user_id
    WHERE id = profile_id;
    
    RAISE NOTICE 'Updated profile user_id from % to %', 
      (SELECT user_id FROM public.profiles WHERE id = profile_id),
      auth_user_id;
  ELSE
    RAISE NOTICE 'Could not find auth user or profile for nxblochain@gmail.com';
  END IF;
END $$;