import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching shared document with token: ${token}`);

    // Get share record with document details
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .select(`
        token,
        can_edit,
        expires_at,
        share_type,
        documents (
          id,
          title,
          file_name,
          file_path,
          mime_type,
          projects (
            name,
            clients (
              name
            )
          )
        )
      `)
      .eq('token', token)
      .maybeSingle();

    if (shareError) {
      console.error('Share query error:', shareError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch share data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!shareData) {
      return new Response(
        JSON.stringify({ error: 'Share not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if share has expired
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Share has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get document content if file exists
    let content = '';
    const document = shareData.documents;

    if (document.file_path) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(document.file_path);

        if (downloadError) {
          console.error('File download error:', downloadError);
          content = 'Error loading document content.';
        } else if (document.file_name?.endsWith('.docx')) {
          // For .docx files, we can't parse them server-side easily
          // We'll let the client handle this
          content = '[DOCX file - content will be parsed on client side]';
        } else {
          // Try to read as text
          content = await fileData.text();
        }
      } catch (err) {
        console.error('File processing error:', err);
        content = 'Error processing document content.';
      }
    } else {
      content = 'No file uploaded for this document.';
    }

    // Get version content based on share type
    let versions = [];
    const document = shareData.documents;

    if (shareData.share_type === 'all_versions') {
      // Get all versions for version switching
      const { data: allVersions } = await supabase
        .from('document_versions')
        .select('id, version_number, content, created_at, created_by')
        .eq('document_id', document.id)
        .order('created_at', { ascending: false });
      
      versions = allVersions || [];
    }

    // Get latest version content as fallback
    const { data: versionData } = await supabase
      .from('document_versions')
      .select('content')
      .eq('document_id', document.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const finalContent = versionData?.content || content;

    const response = {
      share: {
        token: shareData.token,
        can_edit: shareData.can_edit,
        expires_at: shareData.expires_at,
        share_type: shareData.share_type,
      },
      documentData: {
        id: document.id,
        title: document.title,
        file_name: document.file_name,
        content: finalContent,
        project: document.projects?.name,
        client: document.projects?.clients?.name,
      },
      versions: versions
    };

    console.log(`Successfully fetched shared document: ${document.title}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});