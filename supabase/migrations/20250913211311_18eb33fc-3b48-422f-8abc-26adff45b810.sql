-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.category::text,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 
    documents.status = 'approved'
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;