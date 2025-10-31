-- Fix search_path security warning for the signature completion function
CREATE OR REPLACE FUNCTION update_letter_status_on_signature_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_signature_request_id uuid;
  v_letter_id uuid;
  v_total_recipients integer;
  v_signed_recipients integer;
BEGIN
  -- Get the signature request ID
  v_signature_request_id := NEW.signature_request_id;
  
  -- Get the letter ID
  SELECT letter_id INTO v_letter_id
  FROM signature_requests
  WHERE id = v_signature_request_id;
  
  -- Count total recipients and signed recipients for this request
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed
  INTO v_total_recipients, v_signed_recipients
  FROM signature_recipients
  WHERE signature_request_id = v_signature_request_id;
  
  -- If all recipients have signed, update letter status
  IF v_total_recipients > 0 AND v_signed_recipients = v_total_recipients THEN
    UPDATE legal_letters
    SET 
      status = 'signed',
      signed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_letter_id;
    
    -- Also update signature request status to completed
    UPDATE signature_requests
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_signature_request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';