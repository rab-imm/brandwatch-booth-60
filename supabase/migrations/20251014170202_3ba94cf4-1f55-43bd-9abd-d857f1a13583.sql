-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg']::text[]
);

-- RLS policies for signatures bucket
CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Users can view their own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "System can access all signatures"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'signatures');