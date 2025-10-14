-- Phase 7: Advanced Features Schema

-- Add webhook URL to signature requests
ALTER TABLE signature_requests
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['completed']::TEXT[];

-- Create table for webhook delivery logs
CREATE TABLE IF NOT EXISTS signature_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE signature_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook logs
CREATE POLICY "Request creators can view webhook logs"
ON signature_webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM signature_requests
    WHERE signature_requests.id = signature_webhook_logs.signature_request_id
    AND signature_requests.created_by = auth.uid()
  )
);

CREATE POLICY "System can insert webhook logs"
ON signature_webhook_logs
FOR INSERT
WITH CHECK (true);

-- Add certificate generation tracking
ALTER TABLE signature_requests
ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP WITH TIME ZONE;

-- Create batch signature requests table
CREATE TABLE IF NOT EXISTS batch_signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  batch_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_requests INTEGER DEFAULT 0,
  completed_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Link individual requests to batches
ALTER TABLE signature_requests
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batch_signature_requests(id) ON DELETE SET NULL;

-- Enable RLS on batch table
ALTER TABLE batch_signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their batches"
ON batch_signature_requests
FOR ALL
USING (created_by = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_signature_webhook_logs_request_id 
ON signature_webhook_logs(signature_request_id);

CREATE INDEX IF NOT EXISTS idx_signature_requests_batch_id 
ON signature_requests(batch_id);

CREATE INDEX IF NOT EXISTS idx_batch_signature_requests_created_by 
ON batch_signature_requests(created_by);