-- Enable real-time for legal_letters table
ALTER TABLE legal_letters REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE legal_letters;