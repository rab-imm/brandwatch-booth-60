import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token } = await req.json();

    // Get share link details
    const { data: shareLink, error: linkError } = await supabase
      .from('letter_share_links')
      .select(`
        *,
        legal_letters (
          id,
          title,
          content,
          letter_type,
          created_at
        )
      `)
      .eq('token', token)
      .single();

    if (linkError || !shareLink) {
      return new Response(
        JSON.stringify({ error: 'Share link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link is valid
    if (shareLink.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'This link has been revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This link has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const letter = shareLink.legal_letters;

    // Create HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
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
              font-size: 14px;
              margin-top: 30px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 11px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${letter.title}</div>
            <div class="metadata">Type: ${letter.letter_type}</div>
            <div class="metadata">Created: ${new Date(letter.created_at).toLocaleDateString()}</div>
            ${shareLink.recipient_name ? `<div class="metadata">Shared with: ${shareLink.recipient_name}</div>` : ''}
          </div>
          <div class="content">
            ${letter.content}
          </div>
          <div class="footer">
            <p>This document was securely shared via UAE Legal Assistant</p>
            <p>Shared on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    // For now, return the HTML with PDF headers
    // In production, you'd use a proper HTML-to-PDF converter
    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${letter.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
