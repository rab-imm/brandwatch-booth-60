-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  manager_id UUID,
  credit_allocation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view their departments"
  ON public.departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles
      WHERE user_id = auth.uid() AND company_id = departments.company_id
    )
  );

CREATE POLICY "Company admins can manage their departments"
  ON public.departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles
      WHERE user_id = auth.uid() 
        AND company_id = departments.company_id 
        AND role = 'company_admin'::user_role
    )
  );

-- Create letter_assignments table
CREATE TABLE IF NOT EXISTS public.letter_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES public.legal_letters(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.letter_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments to them"
  ON public.letter_assignments FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by);

CREATE POLICY "Assigners can create assignments"
  ON public.letter_assignments FOR INSERT
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Company admins can manage all assignments"
  ON public.letter_assignments FOR ALL
  USING (has_role(auth.uid(), 'company_admin'::user_role));

-- Create permission_templates table
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage permission templates"
  ON public.permission_templates FOR ALL
  USING (has_role(auth.uid(), 'company_admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role));

-- Update profiles table to add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create updated_at trigger for departments
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for letter_assignments
CREATE TRIGGER update_letter_assignments_updated_at
  BEFORE UPDATE ON public.letter_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for permission_templates
CREATE TRIGGER update_permission_templates_updated_at
  BEFORE UPDATE ON public.permission_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();