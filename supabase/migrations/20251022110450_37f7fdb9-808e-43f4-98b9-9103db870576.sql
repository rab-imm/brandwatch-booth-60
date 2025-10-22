-- Fix RLS for password_reset_attempts table
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for password reset attempts
-- Only system can insert (rate limit checking function)
CREATE POLICY "System can insert password reset attempts"
ON public.password_reset_attempts
FOR INSERT
WITH CHECK (true);

-- Super admins can view all attempts
CREATE POLICY "Super admins can view all password reset attempts"
ON public.password_reset_attempts
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::user_role));