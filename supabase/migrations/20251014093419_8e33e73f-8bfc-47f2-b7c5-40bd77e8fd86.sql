-- Create signature request status enum
CREATE TYPE signature_request_status AS ENUM ('draft', 'sent', 'in_progress', 'completed', 'cancelled', 'expired');

-- Create signature field type enum
CREATE TYPE signature_field_type AS ENUM ('signature', 'initial', 'date', 'text', 'checkbox');

-- Signature Requests table
CREATE TABLE public.signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES public.legal_letters(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  status signature_request_status NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  allow_editing BOOLEAN DEFAULT false,
  signing_order_enabled BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signature Recipients table
CREATE TABLE public.signature_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'signer',
  signing_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  access_token TEXT UNIQUE NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signature Field Positions table
CREATE TABLE public.signature_field_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.signature_recipients(id) ON DELETE CASCADE,
  field_type signature_field_type NOT NULL,
  page_number INTEGER NOT NULL,
  x_position NUMERIC(10,2) NOT NULL,
  y_position NUMERIC(10,2) NOT NULL,
  width NUMERIC(10,2) NOT NULL,
  height NUMERIC(10,2) NOT NULL,
  is_required BOOLEAN DEFAULT true,
  field_label TEXT,
  placeholder_text TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  field_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signing Sessions table
CREATE TABLE public.signing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.signature_recipients(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_field_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signature_requests
CREATE POLICY "Users can view their own signature requests"
  ON public.signature_requests FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create signature requests for their letters"
  ON public.signature_requests FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.legal_letters WHERE id = letter_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their own signature requests"
  ON public.signature_requests FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Super admins can manage all signature requests"
  ON public.signature_requests FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for signature_recipients
CREATE POLICY "Anyone with token can view recipient info"
  ON public.signature_recipients FOR SELECT
  USING (true);

CREATE POLICY "Request creators can manage recipients"
  ON public.signature_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.signature_requests 
      WHERE id = signature_request_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for signature_field_positions
CREATE POLICY "Anyone can view field positions for their session"
  ON public.signature_field_positions FOR SELECT
  USING (true);

CREATE POLICY "Request creators can manage field positions"
  ON public.signature_field_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.signature_requests 
      WHERE id = signature_request_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for signing_sessions
CREATE POLICY "Anyone with token can access their session"
  ON public.signing_sessions FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_signature_requests_letter_id ON public.signature_requests(letter_id);
CREATE INDEX idx_signature_requests_created_by ON public.signature_requests(created_by);
CREATE INDEX idx_signature_recipients_request_id ON public.signature_recipients(signature_request_id);
CREATE INDEX idx_signature_recipients_access_token ON public.signature_recipients(access_token);
CREATE INDEX idx_signature_field_positions_request_id ON public.signature_field_positions(signature_request_id);
CREATE INDEX idx_signature_field_positions_recipient_id ON public.signature_field_positions(recipient_id);
CREATE INDEX idx_signing_sessions_recipient_id ON public.signing_sessions(recipient_id);
CREATE INDEX idx_signing_sessions_session_token ON public.signing_sessions(session_token);

-- Trigger for updated_at
CREATE TRIGGER update_signature_requests_updated_at
  BEFORE UPDATE ON public.signature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signature_recipients_updated_at
  BEFORE UPDATE ON public.signature_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();