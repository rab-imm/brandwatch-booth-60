-- Add metadata column to messages table to store sources
ALTER TABLE public.messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;