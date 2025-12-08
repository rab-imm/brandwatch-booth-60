-- Add missing structured_summary column to ocr_history table
ALTER TABLE public.ocr_history 
ADD COLUMN IF NOT EXISTS structured_summary jsonb;