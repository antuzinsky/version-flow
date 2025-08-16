import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    const supabase = createClient(
      'https://nmcipsyyhnlquloudalf.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { token } = body;
    
    console.log('Token received:', token);

    if (!token) {
      console.log('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test the service role key
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Service key available:', !!serviceKey);
    console.log('Service key length:', serviceKey?.length || 0);

    // Simple query test
    const { data: testData, error: testError } = await supabase
      .from('shares')
      .select('token, share_type')
      .eq('token', token)
      .single();

    console.log('Test query result:', { testData, testError });

    if (testError) {
      console.error('Database error:', testError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: testError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!testData) {
      console.log('No share found');
      return new Response(
        JSON.stringify({ error: 'Share not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    const response = {
      share: { token: testData.token, share_type: testData.share_type },
      documentData: { title: 'Test Document' },
      versions: []
    };

    console.log('Returning success response');
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});