-- Reset query usage for specific user by email
UPDATE public.profiles 
SET 
  queries_used = 0,
  max_credits_per_period = 1000,
  queries_reset_date = date_trunc('month', now() + interval '1 month')
WHERE email = 'janoon@gmail.com';