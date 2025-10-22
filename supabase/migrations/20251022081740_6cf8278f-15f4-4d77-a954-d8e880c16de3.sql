-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Public access for signature recipients" ON public.legal_letters;

-- Create a security definer function to validate signature recipient access
CREATE OR REPLACE FUNCTION public.is_valid_signature_recipient(_letter_id uuid, _access_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM signature_recipients sr
    JOIN signature_requests req ON req.id = sr.signature_request_id
    WHERE req.letter_id = _letter_id
      AND sr.access_token = _access_token
      AND sr.status != 'declined'
      AND (req.expires_at IS NULL OR req.expires_at > now())
  )
$$;

-- Create new restrictive policy that requires valid access token
-- This will be used by the viewing pages that have the token in the URL
CREATE POLICY "Signature recipients can view with valid token"
ON public.legal_letters
FOR SELECT
USING (
  -- Allow if user owns the letter
  auth.uid() = user_id
  OR
  -- Allow if user is company admin viewing team letter
  EXISTS (
    SELECT 1
    FROM user_company_roles ucr
    WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = legal_letters.company_id 
      AND has_role(auth.uid(), 'company_admin'::user_role)
  )
  OR
  -- Allow if user is super admin
  has_role(auth.uid(), 'super_admin'::user_role)
  OR
  -- Allow if accessing via valid signature recipient token stored in JWT custom claim
  -- The signing session page will set this claim when validating the token
  (
    (current_setting('request.jwt.claims', true)::json->>'letter_id')::uuid = id
    AND is_valid_signature_recipient(
      id, 
      current_setting('request.jwt.claims', true)::json->>'signature_token'
    )
  )
);