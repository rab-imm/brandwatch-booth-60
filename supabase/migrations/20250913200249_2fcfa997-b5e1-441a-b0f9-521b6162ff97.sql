-- Fix the search path for the reset queries function
CREATE OR REPLACE FUNCTION public.reset_monthly_queries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    queries_used = 0,
    queries_reset_date = date_trunc('month', now() + interval '1 month')
  WHERE queries_reset_date <= now();
END;
$$;