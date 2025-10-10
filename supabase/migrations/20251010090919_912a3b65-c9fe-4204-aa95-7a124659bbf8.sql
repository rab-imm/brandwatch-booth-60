
-- Fix the email_change column issue in auth.users table
-- This addresses the "Scan error on column index 8, name email_change" error

UPDATE auth.users
SET 
  email_change = '',
  email_change_token_current = '',
  email_change_token_new = ''
WHERE email = 'nxblochain@gmail.com'
  AND email_change IS NULL;
