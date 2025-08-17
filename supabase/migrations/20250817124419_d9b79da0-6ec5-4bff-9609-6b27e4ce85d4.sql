-- Drop existing policies first
DROP POLICY IF EXISTS "auth_view_documents" ON public.documents;
DROP POLICY IF EXISTS "auth_insert_documents" ON public.documents;
DROP POLICY IF EXISTS "auth_update_documents" ON public.documents;

-- Create new policies for documents table
CREATE POLICY "auth_view_documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "auth_insert_documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies for 'documents' bucket
DROP POLICY IF EXISTS "auth_read_documents_bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_documents_bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_documents_bucket" ON storage.objects;

CREATE POLICY "auth_read_documents_bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "auth_insert_documents_bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "auth_update_documents_bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');