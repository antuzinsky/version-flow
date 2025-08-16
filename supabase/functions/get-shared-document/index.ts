import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  console.log('Function called with method:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      'https://nmcipsyyhnlquloudalf.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Support both GET (no preflight) and POST
    let token: string | null = null
    if (req.method === 'GET') {
      const url = new URL(req.url)
      token = url.searchParams.get('token')
    } else {
      const body = await req.json().catch(() => ({} as any))
      token = body?.token ?? null
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Fetching share by token:', token)

    const { data: share, error: shareErr } = await supabase
      .from('shares')
      .select(`
        token, share_type, can_edit, expires_at,
        documents:documents (
          id, title, file_name, file_path, mime_type,
          projects:projects (
            name,
            clients:clients ( name )
          )
        )
      `)
      .eq('token', token)
      .maybeSingle()

    if (shareErr) {
      console.error('Share query error:', shareErr)
      return new Response(JSON.stringify({ error: 'Failed to fetch share' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!share) {
      return new Response(JSON.stringify({ error: 'Share not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Document content
    const doc = share.documents
    let content = ''

    if (doc?.file_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.file_path)
      if (downloadError) {
        console.error('File download error:', downloadError)
        content = 'Error loading document content.'
      } else if (doc.file_name?.endsWith('.docx')) {
        content = '[DOCX file - content will be parsed on client side]'
      } else {
        content = await fileData.text()
      }
    } else {
      content = 'No file uploaded for this document.'
    }

    // Versions
    let versions: any[] = []
    if (share.share_type === 'all_versions') {
      const { data: allVersions } = await supabase
        .from('document_versions')
        .select('id, version_number, content, created_at, created_by')
        .eq('document_id', doc.id)
        .order('created_at', { ascending: false })
      versions = allVersions || []
    }

    const { data: latest } = await supabase
      .from('document_versions')
      .select('content')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const finalContent = latest?.content || content

    const response = {
      share: {
        token: share.token,
        can_edit: share.can_edit,
        expires_at: share.expires_at,
        share_type: share.share_type,
      },
      documentData: {
        id: doc.id,
        title: doc.title,
        file_name: doc.file_name,
        content: finalContent,
        project: doc.projects?.name,
        client: doc.projects?.clients?.name,
      },
      versions,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})