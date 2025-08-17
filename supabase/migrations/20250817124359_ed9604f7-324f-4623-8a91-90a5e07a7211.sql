-- Ensure RLS enabled on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view/insert/update documents (temporary to unblock UI)
CREATE POLICY IF NOT EXISTS "auth_view_documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "auth_insert_documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "auth_update_documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies for 'documents' bucket
CREATE POLICY IF NOT EXISTS "auth_read_documents_bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY IF NOT EXISTS "auth_insert_documents_bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY IF NOT EXISTS "auth_update_documents_bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');