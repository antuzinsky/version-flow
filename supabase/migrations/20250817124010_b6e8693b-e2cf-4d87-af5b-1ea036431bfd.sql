-- Make project_id optional in documents table
ALTER TABLE public.documents 
ALTER COLUMN project_id DROP NOT NULL;