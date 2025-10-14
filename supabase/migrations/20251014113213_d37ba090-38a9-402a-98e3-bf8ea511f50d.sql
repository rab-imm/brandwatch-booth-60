-- Add email column to user_company_roles
ALTER TABLE user_company_roles ADD COLUMN IF NOT EXISTS email text;

-- Update existing rows with emails from profiles
UPDATE user_company_roles ucr
SET email = p.email
FROM profiles p
WHERE ucr.user_id = p.user_id AND ucr.email IS NULL;