-- Create conversation_folders table
CREATE TABLE public.conversation_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_folders
CREATE POLICY "Users can view own folders"
ON conversation_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
ON conversation_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON conversation_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON conversation_folders FOR DELETE
USING (auth.uid() = user_id);

-- Add folder_id to conversations table
ALTER TABLE public.conversations 
ADD COLUMN folder_id UUID REFERENCES public.conversation_folders(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_conversations_folder_id ON public.conversations(folder_id);

-- Enable realtime for conversation_folders
ALTER TABLE public.conversation_folders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_folders;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_conversation_folders_updated_at
  BEFORE UPDATE ON public.conversation_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();