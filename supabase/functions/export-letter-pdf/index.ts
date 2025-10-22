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

    // Generate HTML for PDF conversion
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 40px;
      line-height: 1.6;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .metadata {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .content {
      white-space: pre-wrap;
      margin-top: 30px;
      font-size: 12pt;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${letter.title}</div>
    <div class="metadata">Type: ${letter.letter_type.replace(/_/g, ' ').toUpperCase()}</div>
    <div class="metadata">Status: ${letter.status.toUpperCase()}</div>
    <div class="metadata">Generated: ${new Date(letter.created_at).toLocaleDateString('en-AE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</div>
  </div>
  <div class="content">${letter.content.replace(/\n/g, '<br>')}</div>
  <div class="footer">
    Generated via UAE Legal AI Platform
  </div>
</body>
</html>`;

    // Use a PDF generation API (example with PDFShift API)
    // Note: In production, you'd use a service like PDFShift, Puppeteer, or similar
    // For now, we'll return the HTML that can be converted client-side or with a service
    
    // Simple approach: Return base64 encoded HTML that can be printed/converted
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
