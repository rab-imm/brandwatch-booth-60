-- Create saved_ocr_documents table
CREATE TABLE saved_ocr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ocr_history_id UUID NOT NULL REFERENCES ocr_history(id) ON DELETE CASCADE,
  
  -- Cached scan data for quick display
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- User metadata
  custom_title TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  -- Full scan results (denormalized for performance)
  scan_results JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_ocr_save UNIQUE(user_id, ocr_history_id)
);

-- Indexes for performance
CREATE INDEX idx_saved_ocr_documents_user_id ON saved_ocr_documents(user_id);
CREATE INDEX idx_saved_ocr_documents_company_id ON saved_ocr_documents(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_saved_ocr_documents_created_at ON saved_ocr_documents(created_at DESC);

-- RLS Policies
ALTER TABLE saved_ocr_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved documents
CREATE POLICY "Users can view their own saved documents"
  ON saved_ocr_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own saved documents
CREATE POLICY "Users can create their own saved documents"
  ON saved_ocr_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved documents
CREATE POLICY "Users can update their own saved documents"
  ON saved_ocr_documents FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own saved documents
CREATE POLICY "Users can delete their own saved documents"
  ON saved_ocr_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Company admins can view team saved documents
CREATE POLICY "Company admins can view team saved documents"
  ON saved_ocr_documents FOR SELECT
  USING (
    company_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_company_roles
      WHERE user_id = auth.uid()
        AND company_id = saved_ocr_documents.company_id
        AND role IN ('company_admin', 'company_manager')
    )
  );

-- Super admins can manage all saved documents
CREATE POLICY "Super admins can manage all saved documents"
  ON saved_ocr_documents FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- Updated timestamp trigger
CREATE TRIGGER update_saved_ocr_documents_updated_at
  BEFORE UPDATE ON saved_ocr_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();