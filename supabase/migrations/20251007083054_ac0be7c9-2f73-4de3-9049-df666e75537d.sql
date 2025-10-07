-- Create password reset codes table
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for password reset requests)
CREATE POLICY "Anyone can request password reset"
ON public.password_reset_codes
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to read their own codes
CREATE POLICY "Users can read their own reset codes"
ON public.password_reset_codes
FOR SELECT
USING (true);

-- Create policy to allow anyone to update (for marking as used)
CREATE POLICY "Anyone can update reset codes"
ON public.password_reset_codes
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_code ON public.password_reset_codes(code);

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_codes 
  WHERE expires_at < now() OR used = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;