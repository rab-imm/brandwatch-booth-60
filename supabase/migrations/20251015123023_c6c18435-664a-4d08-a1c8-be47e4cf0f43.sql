-- Create OCR history table
CREATE TABLE public.ocr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT NOT NULL,
  ai_summary TEXT,
  character_count INTEGER,
  word_count INTEGER,
  credits_used INTEGER DEFAULT 2,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.ocr_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own OCR history
CREATE POLICY "Users can view their own OCR history"
  ON public.ocr_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own OCR records
CREATE POLICY "Users can insert their own OCR records"
  ON public.ocr_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Company admins can view team OCR history
CREATE POLICY "Company admins can view team OCR history"
  ON public.ocr_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles
      WHERE user_id = auth.uid()
      AND company_id = ocr_history.company_id
      AND (role = 'company_admin'::user_role OR role = 'company_manager'::user_role)
    )
  );

-- Super admins can view all OCR history
CREATE POLICY "Super admins can manage all OCR history"
  ON public.ocr_history FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Create storage bucket for OCR documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ocr-documents',
  'ocr-documents',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for OCR documents
CREATE POLICY "Users can upload their own OCR documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ocr-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own OCR documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ocr-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own OCR documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ocr-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Super admins can manage all OCR documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'ocr-documents' AND
    has_role(auth.uid(), 'super_admin'::user_role)
  );