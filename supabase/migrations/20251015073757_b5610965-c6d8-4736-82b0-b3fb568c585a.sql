-- Phase 4.2: Update RLS policies to use has_role() function consistently

-- Update conversations table policies
DROP POLICY IF EXISTS "Company admins can view team conversations" ON conversations;
CREATE POLICY "Company admins can view team conversations" 
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles ucr
    JOIN profiles p ON p.user_id = conversations.user_id
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = p.current_company_id
    AND has_role(auth.uid(), 'company_admin'::user_role)
  )
);

-- Update messages table policies
DROP POLICY IF EXISTS "Company admins can view team messages" ON messages;
CREATE POLICY "Company admins can view team messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.user_id = c.user_id
    JOIN user_company_roles ucr ON ucr.company_id = p.current_company_id
    WHERE c.id = messages.conversation_id
    AND ucr.user_id = auth.uid()
    AND has_role(auth.uid(), 'company_admin'::user_role)
  )
);

-- Update legal_letters table policies
DROP POLICY IF EXISTS "Company admins can view team letters" ON legal_letters;
CREATE POLICY "Company admins can view team letters"
ON legal_letters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles ucr
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = legal_letters.company_id
    AND has_role(auth.uid(), 'company_admin'::user_role)
  )
);

-- Update letter_approvals table policies
DROP POLICY IF EXISTS "Company admins and managers can view approvals" ON letter_approvals;
CREATE POLICY "Company admins and managers can view approvals"
ON letter_approvals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM legal_letters ll
    JOIN user_company_roles ucr ON ucr.user_id = ll.user_id
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE ll.id = letter_approvals.letter_id
    AND ucr.company_id = p.current_company_id
    AND (
      has_role(auth.uid(), 'company_admin'::user_role) OR
      has_role(auth.uid(), 'company_manager'::user_role)
    )
  )
);

DROP POLICY IF EXISTS "Managers and admins can update approvals" ON letter_approvals;
CREATE POLICY "Managers and admins can update approvals"
ON letter_approvals FOR UPDATE
USING (
  has_role(auth.uid(), 'company_admin'::user_role) OR
  has_role(auth.uid(), 'company_manager'::user_role)
);

-- Update company_activity_logs table policies
DROP POLICY IF EXISTS "Company admins can view their company logs" ON company_activity_logs;
CREATE POLICY "Company admins can view their company logs"
ON company_activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_roles ucr
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = company_activity_logs.company_id
    AND has_role(auth.uid(), 'company_admin'::user_role)
  )
);