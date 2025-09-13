-- Reset query usage and increase limit for testing
UPDATE public.profiles 
SET 
  queries_used = 0,
  max_credits_per_period = 1000,
  queries_reset_date = date_trunc('month', now() + interval '1 month')
WHERE user_id = auth.uid();

-- Also create a function to easily reset query usage for testing
CREATE OR REPLACE FUNCTION public.reset_user_queries(target_user_id uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    queries_used = 0,
    queries_reset_date = date_trunc('month', now() + interval '1 month')
  WHERE user_id = target_user_id;
END;
$$;