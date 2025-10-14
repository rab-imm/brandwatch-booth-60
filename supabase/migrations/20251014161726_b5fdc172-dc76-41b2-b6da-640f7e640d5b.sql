-- Drop the recursive policies
DROP POLICY IF EXISTS "Public access for signature recipients" ON public.signature_requests;
DROP POLICY IF EXISTS "Public access for signature recipients" ON public.legal_letters;

-- Create security definer function to check if signature request has recipients
CREATE OR REPLACE FUNCTION public.has_signature_recipients(_signature_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.signature_recipients
    WHERE signature_request_id = _signature_request_id
  )
$$;

-- Create security definer function to check if letter has signature recipients
CREATE OR REPLACE FUNCTION public.letter_has_signature_recipients(_letter_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.signature_requests sr
    INNER JOIN public.signature_recipients srec ON srec.signature_request_id = sr.id
    WHERE sr.letter_id = _letter_id
  )
$$;

-- Add non-recursive public policies using security definer functions
CREATE POLICY "Public access for signature recipients"
ON public.signature_requests
FOR SELECT
USING (public.has_signature_recipients(id));

CREATE POLICY "Public access for signature recipients"
ON public.legal_letters
FOR SELECT
USING (public.letter_has_signature_recipients(id));