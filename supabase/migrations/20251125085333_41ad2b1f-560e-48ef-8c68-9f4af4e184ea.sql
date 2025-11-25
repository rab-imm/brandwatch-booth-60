-- Make signatures bucket public so signed document images load correctly
UPDATE storage.buckets
SET public = true
WHERE id = 'signatures';

-- Add public SELECT policy for signatures (anyone can view signed documents)
CREATE POLICY "Public can view signatures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signatures');