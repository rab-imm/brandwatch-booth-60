-- Create document_versions table
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage document versions"
  ON public.document_versions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Create document_expiry_tracking table
CREATE TABLE IF NOT EXISTS public.document_expiry_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE UNIQUE,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_remind BOOLEAN NOT NULL DEFAULT true,
  auto_archive BOOLEAN NOT NULL DEFAULT false,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_expiry_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage document expiry"
  ON public.document_expiry_tracking FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Create updated_at trigger for document_expiry_tracking
CREATE TRIGGER update_document_expiry_tracking_updated_at
  BEFORE UPDATE ON public.document_expiry_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();