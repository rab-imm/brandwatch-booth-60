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

    // Generate professional PDF HTML with proper styling
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${letter.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Crimson+Pro:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 12pt;
      line-height: 1.75;
      color: #1e293b;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      page-break-after: avoid;
    }
    
    h1 { 
      font-size: 24pt; 
      margin: 24px 0 16px; 
      color: #0f172a;
    }
    
    h2 { 
      font-size: 20pt; 
      margin: 20px 0 12px; 
      color: #1e293b;
    }
    
    h3 { 
      font-size: 16pt; 
      margin: 16px 0 10px; 
      color: #334155;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
      hyphens: auto;
      orphans: 3;
      widows: 3;
    }
    
    strong {
      font-weight: 600;
      color: #0f172a;
    }
    
    em {
      font-style: italic;
    }
    
    ul, ol {
      margin: 16px 0;
      padding-left: 32px;
    }
    
    li {
      margin: 8px 0;
      page-break-inside: avoid;
    }
    
    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #475569;
    }
    
    .document-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid #3b82f6;
      page-break-after: avoid;
    }
    
    .brand {
      font-family: 'Inter', sans-serif;
      font-size: 16pt;
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .doc-title {
      font-size: 22pt;
      font-weight: 600;
      color: #0f172a;
      display: block;
      margin: 16px 0 8px;
    }
    
    .description {
      font-family: 'Inter', sans-serif;
      color: #64748b;
      font-style: italic;
      font-size: 11pt;
      margin-top: 12px;
    }
    
    .content {
      margin-top: 30px;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #64748b;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #3b82f6;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .no-print {
        display: none !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      
      p, li {
        orphans: 3;
        widows: 3;
      }
      
      blockquote, ul, ol {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <header class="document-header">
    <div class="brand">Graysen.AI</div>
    <h1 class="doc-title">${letter.title}</h1>
    ${letter.description ? `<p class="description">${letter.description}</p>` : ''}
  </header>
  
  <main class="content">
    ${renderedContent}
  </main>
  
  <footer class="footer">
    <div class="footer-brand">Graysen.AI</div>
    <div>Professional Legal Document Generation</div>
    <div style="margin-top: 8px;">
      Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })}
    </div>
  </footer>
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