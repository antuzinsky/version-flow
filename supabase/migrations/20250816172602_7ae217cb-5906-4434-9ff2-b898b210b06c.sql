-- Create folders table to replace the client/project hierarchy
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create policies for folders
CREATE POLICY "Users can view their own folders" 
ON public.folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add folder_id to documents table (replacing project_id)
ALTER TABLE public.documents 
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates on folders
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();