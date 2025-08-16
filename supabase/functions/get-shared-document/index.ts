import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  try { console.log('[get-shared-document] entry', req.method, req.url) } catch (_) {}
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Health check without touching DB
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('ping') === '1') {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (_) {}

  const supabase = createClient(
    'https://nmcipsyyhnlquloudalf.supabase.co',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const hasKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    try { console.log('[get-shared-document] has service role key:', hasKey) } catch (_) {}

    // Support GET ?token=... and POST { token }
    let token: string | null = null
    if (req.method === 'GET') {
      const url = new URL(req.url)
      token = url.searchParams.get('token')
    } else {
      const body = await req.json().catch(() => ({})) as any
      token = body?.token ?? null
      try { console.log('[get-shared-document] token from body present:', !!token) } catch (_) {}

    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1) Fetch share (no joins, avoid FK dependency)
    const { data: share, error: shareErr } = await supabase
      .from('shares')
      .select('token, can_edit, expires_at, share_type, document_id')
      .eq('token', token)
      .maybeSingle()

    if (shareErr) throw new Error(`Share query failed: ${shareErr.message}`)
    if (!share) {
      return new Response(JSON.stringify({ error: 'Share not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2) Fetch document
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, title, file_name, file_path, mime_type, project_id')
      .eq('id', share.document_id)
      .maybeSingle()
    if (docErr) throw new Error(`Document query failed: ${docErr.message}`)
    if (!doc) throw new Error('Document not found')

    // 3) Fetch project
    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('id', doc.project_id)
      .maybeSingle()
    if (projErr) throw new Error(`Project query failed: ${projErr.message}`)

    // 4) Fetch client
    let clientName: string | null = null
    if (proj?.client_id) {
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', proj.client_id)
        .maybeSingle()
      if (clientErr) throw new Error(`Client query failed: ${clientErr.message}`)
      clientName = client?.name ?? null
    }

    // 5) Load file content (text fallback)
    let content = ''
    if (doc.file_path) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('documents')
        .download(doc.file_path)
      if (fileErr) {
        content = 'Error loading document content.'
      } else if (doc.file_name?.toLowerCase().endsWith('.docx')) {
        content = '[DOCX file - content will be parsed on client side]'
      } else {
        content = await fileData.text()
      }
    } else {
      content = 'No file uploaded for this document.'
    }

    // 6) Versions
    let versions: any[] = []
    if (share.share_type === 'all_versions') {
      const { data: allVersions, error: verErr } = await supabase
        .from('document_versions')
        .select('id, version_number, content, created_at, created_by')
        .eq('document_id', doc.id)
        .order('created_at', { ascending: false })
      if (verErr) throw new Error(`Versions query failed: ${verErr.message}`)
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
        project: proj?.name ?? null,
        client: clientName,
      },
      versions,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})