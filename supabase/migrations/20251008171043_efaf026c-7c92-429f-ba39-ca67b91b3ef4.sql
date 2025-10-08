-- Phase 4c: Add permissions column to user_company_roles for granular access control
ALTER TABLE public.user_company_roles 
ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining permissions structure
COMMENT ON COLUMN public.user_company_roles.permissions IS 'Granular permissions: can_view_team_analytics, can_approve_requests, can_view_team_chats, can_adjust_credits';

-- Update RLS policies for conversations and messages to allow company admins to view all team conversations
CREATE POLICY "Company admins can view team conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_roles ucr1
    JOIN public.profiles p ON p.user_id = conversations.user_id
    WHERE ucr1.user_id = auth.uid()
    AND ucr1.company_id = p.current_company_id
    AND ucr1.role = 'company_admin'::user_role
  )
);

CREATE POLICY "Company admins can view team messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON p.user_id = c.user_id
    JOIN public.user_company_roles ucr ON ucr.company_id = p.current_company_id
    WHERE c.id = messages.conversation_id
    AND ucr.user_id = auth.uid()
    AND ucr.role = 'company_admin'::user_role
  )
);

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _company_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_company_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND (
        permissions ? _permission
        OR role = 'company_admin'::user_role
        OR role = 'super_admin'::user_role
      )
  )
$$;