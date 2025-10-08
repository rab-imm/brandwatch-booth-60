-- Create enum for letter status
CREATE TYPE letter_status AS ENUM ('draft', 'finalized', 'sent', 'signed');

-- Create enum for letter types
CREATE TYPE letter_type AS ENUM (
  'employment_termination',
  'employment_contract',
  'lease_agreement',
  'lease_termination',
  'demand_letter',
  'nda',
  'settlement_agreement',
  'power_of_attorney',
  'general_legal'
);

-- Create legal_letters table
CREATE TABLE public.legal_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  letter_type letter_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status letter_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  credits_used INTEGER NOT NULL DEFAULT 0,
  finalized_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letter_templates table for future use
CREATE TABLE public.letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_type letter_type NOT NULL,
  title TEXT NOT NULL,
  template_content TEXT NOT NULL,
  description TEXT,
  required_fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_letters
CREATE POLICY "Users can view their own letters"
  ON public.legal_letters
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own letters"
  ON public.legal_letters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft letters"
  ON public.legal_letters
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can delete their own draft letters"
  ON public.legal_letters
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Company admins can view team letters"
  ON public.legal_letters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles ucr
      WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = legal_letters.company_id
        AND ucr.role = 'company_admin'::user_role
    )
  );

CREATE POLICY "Super admins can manage all letters"
  ON public.legal_letters
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for letter_templates
CREATE POLICY "Everyone can view active templates"
  ON public.letter_templates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage all templates"
  ON public.letter_templates
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::user_role));

-- Create indexes for performance
CREATE INDEX idx_legal_letters_user_id ON public.legal_letters(user_id);
CREATE INDEX idx_legal_letters_company_id ON public.legal_letters(company_id);
CREATE INDEX idx_legal_letters_status ON public.legal_letters(status);
CREATE INDEX idx_legal_letters_letter_type ON public.legal_letters(letter_type);
CREATE INDEX idx_legal_letters_created_at ON public.legal_letters(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_legal_letters_updated_at
  BEFORE UPDATE ON public.legal_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();