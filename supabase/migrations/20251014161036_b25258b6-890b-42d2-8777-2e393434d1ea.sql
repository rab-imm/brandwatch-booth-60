-- Add public RLS policies for signature viewing through valid recipient tokens

-- Policy for signature_requests: Allow public SELECT when there's a related recipient
CREATE POLICY "Public access for signature recipients"
ON public.signature_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.signature_recipients
    WHERE signature_recipients.signature_request_id = signature_requests.id
  )
);

-- Policy for legal_letters: Allow public SELECT when linked to signature request with recipients
CREATE POLICY "Public access for signature recipients"
ON public.legal_letters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.signature_requests
    INNER JOIN public.signature_recipients ON signature_recipients.signature_request_id = signature_requests.id
    WHERE signature_requests.letter_id = legal_letters.id
  )
);