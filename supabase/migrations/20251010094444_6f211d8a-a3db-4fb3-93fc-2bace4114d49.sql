-- Phase 1: Create company activity logs table for tracking admin actions

-- Create enum for activity types
CREATE TYPE company_activity_type AS ENUM (
  'user_invited',
  'user_deleted',
  'user_role_changed',
  'user_credits_updated',
  'invitation_accepted',
  'invitation_cancelled',
  'company_updated',
  'department_created',
  'department_updated',
  'department_deleted'
);

-- Create company_activity_logs table
CREATE TABLE public.company_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL, -- The admin who performed the action
  activity_type company_activity_type NOT NULL,
  target_user_id UUID, -- User affected by the action (if applicable)
  target_entity_id UUID, -- Generic entity ID (department, etc)
  target_entity_type TEXT, -- Type of entity (department, role, etc)
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_company_activity_logs_company_id ON public.company_activity_logs(company_id);
CREATE INDEX idx_company_activity_logs_performed_by ON public.company_activity_logs(performed_by);
CREATE INDEX idx_company_activity_logs_target_user_id ON public.company_activity_logs(target_user_id);
CREATE INDEX idx_company_activity_logs_activity_type ON public.company_activity_logs(activity_type);
CREATE INDEX idx_company_activity_logs_created_at ON public.company_activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.company_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_activity_logs
-- Company admins can view logs for their company
CREATE POLICY "Company admins can view their company logs"
ON public.company_activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles ucr
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = company_activity_logs.company_id
    AND ucr.role = 'company_admin'::user_role
  )
);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.company_activity_logs
FOR INSERT
WITH CHECK (true);

-- Super admins can manage all logs
CREATE POLICY "Super admins can manage all activity logs"
ON public.company_activity_logs
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::user_role));

-- Add a trigger to update the updated_at column on company_activity_logs
CREATE TRIGGER update_company_activity_logs_updated_at
BEFORE UPDATE ON public.company_activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for company_activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_activity_logs;