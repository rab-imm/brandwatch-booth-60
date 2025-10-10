-- Create letter_approvals table for approval workflows
CREATE TABLE IF NOT EXISTS public.letter_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_id UUID NOT NULL REFERENCES public.legal_letters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letter_approvals ENABLE ROW LEVEL SECURITY;

-- Company admins and managers can view approvals for their company
CREATE POLICY "Company admins and managers can view approvals"
ON public.letter_approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.legal_letters ll
    JOIN public.user_company_roles ucr ON ucr.user_id = ll.user_id
    WHERE ll.id = letter_approvals.letter_id
    AND ucr.company_id = (
      SELECT current_company_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND ucr.role IN ('company_admin', 'company_manager')
  )
);

-- Managers and admins can update approvals
CREATE POLICY "Managers and admins can update approvals"
ON public.letter_approvals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND user_role IN ('company_admin', 'company_manager')
  )
);

-- System can insert approvals
CREATE POLICY "System can insert approvals"
ON public.letter_approvals
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_letter_approvals_updated_at
BEFORE UPDATE ON public.letter_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.letter_approvals;