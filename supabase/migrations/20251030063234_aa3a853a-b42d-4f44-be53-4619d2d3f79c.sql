-- Create contacts table for user contact management
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_email UNIQUE(user_id, email),
  CONSTRAINT unique_company_email UNIQUE(company_id, email)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contacts
CREATE POLICY "Users can view their own contacts"
ON public.contacts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own contacts
CREATE POLICY "Users can create their own contacts"
ON public.contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own contacts
CREATE POLICY "Users can update their own contacts"
ON public.contacts
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own contacts
CREATE POLICY "Users can delete their own contacts"
ON public.contacts
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Company users can view company contacts
CREATE POLICY "Company users can view company contacts"
ON public.contacts
FOR SELECT
USING (
  company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_company_roles
    WHERE user_id = auth.uid() AND company_id = contacts.company_id
  )
);

-- Policy: Company admins can manage company contacts
CREATE POLICY "Company admins can manage company contacts"
ON public.contacts
FOR ALL
USING (
  company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_company_roles
    WHERE user_id = auth.uid() 
    AND company_id = contacts.company_id 
    AND role = 'company_admin'
  )
);

-- Policy: Super admins can manage all contacts
CREATE POLICY "Super admins can manage all contacts"
ON public.contacts
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_contacts_updated_at();