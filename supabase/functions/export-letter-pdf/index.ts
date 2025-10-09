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

    // Check user credits (queries_used is the DB column name but represents credits)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('queries_used, max_credits_per_period')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditsNeeded = 1; // PDF export costs 1 credit
    const creditsUsed = profile.queries_used || 0; // DB column is queries_used but tracks credits
    const creditsLimit = profile.max_credits_per_period || 0;
    
    if (creditsUsed + creditsNeeded > creditsLimit) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits",
          creditsNeeded,
          creditsAvailable: creditsLimit - creditsUsed
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

    // Deduct credits (queries_used is the DB column name)
    await supabase
      .from('profiles')
      .update({ queries_used: creditsUsed + creditsNeeded })
      .eq('user_id', user.id);

    console.log(`PDF exported for letter ${letterId}, ${creditsNeeded} credit deducted`);

    return new Response(
      JSON.stringify({ 
        pdfData: base64Html,
        filename: `${letter.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        creditsUsed: creditsNeeded,
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
