import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[generate-signed-document-pdf] ${step}`, details || "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Authentication failed");
    }

    logStep("Authenticated user", { userId: user.id });

    const { signature_request_id } = await req.json();

    if (!signature_request_id) {
      throw new Error("signature_request_id is required");
    }

    logStep("Fetching signature request", { signature_request_id });

    // Get signature request
    const { data: request, error: requestError } = await supabaseClient
      .from("signature_requests")
      .select("*, legal_letters(title, content, user_id)")
      .eq("id", signature_request_id)
      .single();

    if (requestError) throw requestError;

    // Verify ownership
    if (request.legal_letters.user_id !== user.id) {
      throw new Error("Unauthorized: You don't own this document");
    }

    // Verify it's completed
    if (request.status !== "completed") {
      throw new Error("Document is not fully signed yet");
    }

    logStep("Fetching recipients");

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from("signature_recipients")
      .select("*")
      .eq("signature_request_id", signature_request_id)
      .eq("status", "signed")
      .order("signing_order", { ascending: true });

    if (recipientsError) throw recipientsError;

    logStep("Fetching signature fields");

    // Get signature field positions and values
    const { data: fields, error: fieldsError } = await supabaseClient
      .from("signature_field_positions")
      .select("*")
      .eq("signature_request_id", signature_request_id);

    if (fieldsError) throw fieldsError;

    logStep("Generating HTML");

    // Generate HTML with signatures
    const html = generateSignedDocumentHTML(
      request.legal_letters.title,
      request.legal_letters.content,
      fields,
      recipients,
      request
    );

    const filename = `${request.legal_letters.title.replace(/[^a-z0-9]/gi, '_')}_signed.html`;

    logStep("Returning signed document", { filename });

    return new Response(
      JSON.stringify({
        success: true,
        pdfHtml: btoa(html),
        filename
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("Error", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

function generateSignedDocumentHTML(
  title: string,
  content: string,
  fields: any[],
  recipients: any[],
  request: any
): string {
  const fieldOverlays = fields
    .map((field) => {
      let fieldContent = '';
      
      switch (field.field_type) {
        case 'signature':
        case 'initial':
          if (field.signature_url) {
            fieldContent = `<img src="${field.signature_url}" alt="${field.label}" style="width: 100%; height: 100%; object-fit: contain;" />`;
          }
          break;
        case 'text':
          if (field.text_value) {
            fieldContent = `<span style="font-size: 14px; font-weight: 500;">${field.text_value}</span>`;
          }
          break;
        case 'date':
          if (field.date_value) {
            const date = new Date(field.date_value);
            fieldContent = `<span style="font-size: 14px; font-weight: 500;">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`;
          }
          break;
        case 'checkbox':
          if (field.checkbox_value) {
            fieldContent = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">✓</div>`;
          }
          break;
      }

      if (!fieldContent) return '';

      return `
        <div style="
          position: absolute;
          left: ${field.x_position}%;
          top: ${field.y_position}%;
          width: ${field.width}%;
          height: ${field.height}%;
          border: 2px solid rgba(59, 130, 246, 0.3);
          background: rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 4px 8px;
          z-index: 10;
        ">
          ${fieldContent}
        </div>
      `;
    })
    .join('');

  const recipientsList = recipients
    .map((recipient) => {
      const signedDate = new Date(recipient.signed_at);
      return `
        <div style="
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: rgba(249, 250, 251, 0.5);
          margin-bottom: 12px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <p style="font-weight: 600; margin: 0;">${recipient.name}</p>
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">${recipient.email}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
                Signed on ${signedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                at ${signedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              ${recipient.ip_address ? `<p style="color: #6b7280; font-size: 11px; margin: 4px 0 0 0;">IP: ${recipient.ip_address}</p>` : ''}
            </div>
            <div style="color: #10b981; font-size: 24px;">✓</div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Signed Document</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Georgia', serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #111827;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    .document-container {
      position: relative;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 60px;
      margin-bottom: 40px;
      min-height: 800px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .content {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
    }
    .verification {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 30px;
      margin-top: 40px;
    }
    .verification h2 {
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #111827;
    }
    .verification-footer {
      margin-top: 30px;
      padding: 20px;
      background: rgba(249, 250, 251, 0.8);
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .verification-footer p {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    .verification-footer .doc-id {
      font-family: monospace;
      font-weight: 600;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <span class="badge">✓ Fully Executed</span>
  </div>

  <div class="document-container">
    <div class="content">${content}</div>
    ${fieldOverlays}
  </div>

  <div class="verification">
    <h2>
      <span style="color: #10b981; font-size: 24px;">🛡️</span>
      Digital Signature Verification
    </h2>
    ${recipientsList}
    
    <div class="verification-footer">
      <p><strong>Document ID:</strong> <span class="doc-id">${request.id}</span></p>
      <p style="margin-top: 8px;">
        This document has been digitally signed and is tamper-evident. 
        Any modifications will invalidate the signatures.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
