import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { marked } from 'https://esm.sh/marked@11.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LetterShareData {
  letter: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    created_at: string;
  };
  recipientName: string;
  expiresAt: string | null;
  viewCount: number;
  maxViews: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, password } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for token:', token);

    // Fetch share link data
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('letter_share_links')
      .select(`
        id,
        letter_id,
        recipient_email,
        recipient_name,
        password_hash,
        expires_at,
        max_views,
        view_count,
        revoked
      `)
      .eq('token', token)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Share link not found:', shareLinkError);
      return new Response(
        JSON.stringify({ error: 'Share link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link is revoked
    if (shareLink.revoked) {
      return new Response(
        JSON.stringify({ error: 'This link has been revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This link has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max views
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return new Response(
        JSON.stringify({ error: 'Maximum view limit reached' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password if set
    if (shareLink.password_hash && password !== shareLink.password_hash) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the letter
    const { data: letter, error: letterError } = await supabase
      .from('legal_letters')
      .select('id, title, description, content, created_at')
      .eq('id', shareLink.letter_id)
      .single();

    if (letterError || !letter) {
      console.error('Letter not found:', letterError);
      return new Response(
        JSON.stringify({ error: 'Letter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert markdown to HTML
    const renderedContent = await marked.parse(letter.content);

    // Generate PDF HTML with proper styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      font-size: 22px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h3 {
      color: #4a5568;
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    strong {
      font-weight: 600;
      color: #2d3748;
    }
    em {
      font-style: italic;
    }
    ul, ol {
      margin-bottom: 16px;
      padding-left: 30px;
    }
    li {
      margin-bottom: 8px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .description {
      color: #64748b;
      font-style: italic;
      margin-bottom: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    @media print {
      body {
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${letter.title}</h1>
    ${letter.description ? `<p class="description">${letter.description}</p>` : ''}
  </div>
  <div class="content">
    ${renderedContent}
  </div>
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
    <p>UAE Legal Assistant - Professional Document Generation</p>
  </div>
</body>
</html>
    `;

    console.log('HTML generated successfully for printing');

    // Return HTML for browser printing
    return new Response(htmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
