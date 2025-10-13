-- Phase 1: DocuSend Database Infrastructure
-- Create letter_share_links table for trackable letter links
CREATE TABLE public.letter_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_id UUID NOT NULL REFERENCES public.legal_letters(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_password_protected BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letter_view_logs table for tracking views
CREATE TABLE public.letter_view_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID NOT NULL REFERENCES public.letter_share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  location_data JSONB,
  view_duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.letter_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_view_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for letter_share_links
CREATE POLICY "Users can view their own share links"
ON public.letter_share_links
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create share links for their own letters"
ON public.letter_share_links
FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 FROM public.legal_letters 
    WHERE id = letter_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own share links"
ON public.letter_share_links
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Super admins can manage all share links"
ON public.letter_share_links
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for letter_view_logs
CREATE POLICY "Users can view logs for their share links"
ON public.letter_view_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.letter_share_links 
    WHERE id = share_link_id AND created_by = auth.uid()
  )
);

CREATE POLICY "System can insert view logs"
ON public.letter_view_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage all view logs"
ON public.letter_view_logs
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::user_role));

-- Add indexes for performance
CREATE INDEX idx_letter_share_links_token ON public.letter_share_links(token);
CREATE INDEX idx_letter_share_links_letter_id ON public.letter_share_links(letter_id);
CREATE INDEX idx_letter_share_links_created_by ON public.letter_share_links(created_by);
CREATE INDEX idx_letter_view_logs_share_link_id ON public.letter_view_logs(share_link_id);
CREATE INDEX idx_letter_view_logs_viewed_at ON public.letter_view_logs(viewed_at);

-- Add trigger for updated_at
CREATE TRIGGER update_letter_share_links_updated_at
BEFORE UPDATE ON public.letter_share_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();