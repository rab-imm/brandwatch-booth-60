-- Create invitation tokens table for company user invitations
CREATE TABLE IF NOT EXISTS public.invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'company_staff',
  max_credits_per_period INTEGER NOT NULL DEFAULT 50,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Company admins can manage invitations for their company
CREATE POLICY "Company admins can manage their company invitations"
ON public.invitation_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_role = 'company_admin'
    AND profiles.current_company_id = invitation_tokens.company_id
  )
);

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage all invitations"
ON public.invitation_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_role = 'super_admin'
  )
);

-- Anyone can view invitations by token (for acceptance page)
CREATE POLICY "Anyone can view invitations by token"
ON public.invitation_tokens
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_invitation_tokens_updated_at
  BEFORE UPDATE ON public.invitation_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for token lookups
CREATE INDEX idx_invitation_tokens_token ON public.invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_email ON public.invitation_tokens(email);