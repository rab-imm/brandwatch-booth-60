-- Enable real-time updates for profiles and companies tables
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE companies REPLICA IDENTITY FULL;

-- Ensure tables are in the real-time publication
-- Note: This will only add them if they're not already there
DO $$
BEGIN
  -- Add profiles to publication if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;

  -- Add companies to publication if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE companies;
  END IF;
END $$;