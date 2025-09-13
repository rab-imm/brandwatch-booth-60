-- Fix security warning: Temporarily drop vector column, move extension, then recreate
ALTER TABLE public.documents DROP COLUMN IF EXISTS embedding;

-- Drop and recreate vector extension in extensions schema
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add the embedding column back with the new extension location
ALTER TABLE public.documents ADD COLUMN embedding extensions.vector(1536);

-- Recreate the index with proper schema reference
CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding extensions.vector_cosine_ops);