import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { letterId } = await req.json();

    if (!letterId) {
      return new Response(
        JSON.stringify({ error: "Letter ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the letter
    const { data: letter, error: letterError } = await supabase
      .from('legal_letters')
      .select('*')
      .eq('id', letterId)
      .eq('user_id', user.id)
      .single();

    if (letterError || !letter) {
      return new Response(
        JSON.stringify({ error: "Letter not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use atomic credit deduction with race condition prevention
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'deduct_credits_atomic',
      {
        p_user_id: user.id,
        p_company_id: letter.company_id || null,
        p_credits_needed: 1,
        p_feature: 'pdf_export',
        p_description: `PDF export for letter: ${letter.title}`,
      }
    );

    if (creditError || !creditResult) {
      console.error('Credit deduction error:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to deduct credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creditResult.success) {
      return new Response(
        JSON.stringify({ 
          error: creditResult.error === 'insufficient_credits' 
            ? 'Insufficient credits for PDF export'
            : creditResult.error === 'insufficient_company_credits'
            ? 'Insufficient company credits for PDF export'
            : creditResult.message || 'Credit deduction failed',
          creditsNeeded: 1,
          creditsAvailable: creditResult.available || 0
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate professional HTML for PDF conversion
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
      margin: 12px 0;
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
    
    .doc-meta {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #64748b;
      margin-top: 12px;
    }
    
    .doc-title {
      font-size: 22pt;
      font-weight: 600;
      color: #0f172a;
      display: block;
      margin: 16px 0 8px;
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
    <div class="doc-title">${letter.title}</div>
    <div class="doc-meta">
      <div>Document Type: ${letter.letter_type.replace(/_/g, ' ').toUpperCase()}</div>
      <div>Status: ${letter.status.toUpperCase()}</div>
      <div>Generated: ${new Date(letter.created_at).toLocaleDateString('en-AE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</div>
    </div>
  </header>
  
  <main class="content">
    ${letter.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
  </main>
  
  <footer class="footer">
    <div class="footer-brand">Graysen.AI</div>
    <div>Professional Legal Document Generation</div>
    <div style="margin-top: 8px;">
      Generated on ${new Date().toLocaleDateString('en-AE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
  </footer>
</body>
</html>`;

    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));

    console.log(`PDF exported for letter ${letterId}, 1 credit deducted (${creditResult.remaining_credits} remaining)`);

    return new Response(
      JSON.stringify({ 
        pdfData: base64Html,
        filename: `${letter.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        creditsUsed: 1,
        creditsRemaining: creditResult.remaining_credits,
        contentType: 'text/html'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in export-letter-pdf:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});