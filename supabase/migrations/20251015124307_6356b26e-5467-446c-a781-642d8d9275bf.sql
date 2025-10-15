-- Update RLS policies for ocr_history to allow company users access
-- Company users can view OCR history for their company
CREATE POLICY "Company users can view their company OCR history"
ON public.ocr_history
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_company_roles ucr
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = ocr_history.company_id
  )
);

-- Company users can insert OCR history for their company
CREATE POLICY "Company users can create OCR records"
ON public.ocr_history
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND company_id IS NULL)  -- Personal OCR
  OR 
  (company_id IS NOT NULL AND EXISTS (  -- Company OCR
    SELECT 1 FROM public.user_company_roles ucr
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = ocr_history.company_id
  ))
);

-- Update storage bucket policies for company users
-- Company users can upload to ocr-documents bucket
CREATE POLICY "Company users can upload OCR documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ocr-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Company users can view their own OCR documents
CREATE POLICY "Company users can view their OCR documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ocr-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);