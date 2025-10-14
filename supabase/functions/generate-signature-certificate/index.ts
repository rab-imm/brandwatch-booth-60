import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GENERATE-CERTIFICATE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;

    const { signature_request_id } = await req.json();

    if (!signature_request_id) {
      throw new Error("Signature request ID required");
    }

    // Get signature request with all details
    const { data: request, error: requestError } = await supabaseClient
      .from("signature_requests")
      .select(`
        *,
        legal_letters!inner(*),
        signature_recipients!inner(
          *,
          signature_field_positions!inner(*)
        )
      `)
      .eq("id", signature_request_id)
      .eq("created_by", userData.user.id)
      .maybeSingle();

    if (requestError || !request) {
      throw new Error("Signature request not found or access denied");
    }

    if (request.status !== "completed") {
      throw new Error("Cannot generate certificate for incomplete signature request");
    }

    logStep("Request verified", { requestId: signature_request_id });

    // Generate certificate HTML
    const certificateHtml = generateCertificateHTML(request);

    // In a real implementation, you would:
    // 1. Convert HTML to PDF using a service like Puppeteer
    // 2. Upload PDF to Supabase Storage
    // 3. Generate a public URL
    // For now, we'll return the HTML and a placeholder URL

    const certificateUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/certificates/${signature_request_id}.pdf`;

    // Update signature request with certificate info
    await supabaseClient
      .from("signature_requests")
      .update({
        certificate_generated: true,
        certificate_url: certificateUrl,
        certificate_generated_at: new Date().toISOString(),
      })
      .eq("id", signature_request_id);

    logStep("Certificate generated", { url: certificateUrl });

    return new Response(JSON.stringify({ 
      success: true,
      certificate_url: certificateUrl,
      certificate_html: certificateHtml
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateCertificateHTML(request: any): string {
  const recipients = request.signature_recipients || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Digital Signature Certificate</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 40px;
          border: 2px solid #000;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #666;
        }
        .section {
          margin: 30px 0;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 200px;
        }
        .value {
          display: inline-block;
        }
        .signatures {
          margin-top: 40px;
        }
        .signature-item {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 2px solid #000;
          font-size: 12px;
          text-align: center;
          color: #666;
        }
        .seal {
          margin: 30px auto;
          width: 150px;
          height: 150px;
          border: 3px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CERTIFICATE OF DIGITAL SIGNATURE</div>
        <div class="subtitle">Authentication and Verification Record</div>
      </div>

      <div class="section">
        <div><span class="label">Document Title:</span><span class="value">${request.title}</span></div>
        <div><span class="label">Request ID:</span><span class="value">${request.id}</span></div>
        <div><span class="label">Created:</span><span class="value">${new Date(request.created_at).toLocaleString()}</span></div>
        <div><span class="label">Completed:</span><span class="value">${new Date(request.completed_at).toLocaleString()}</span></div>
      </div>

      <div class="section">
        <h3>Document Information</h3>
        <div><span class="label">Letter ID:</span><span class="value">${request.letter_id}</span></div>
        <div><span class="label">Status:</span><span class="value">${request.status.toUpperCase()}</span></div>
      </div>

      <div class="signatures">
        <h3>Signatories (${recipients.length})</h3>
        ${recipients.map((r: any, index: number) => `
          <div class="signature-item">
            <div><strong>${index + 1}. ${r.name}</strong></div>
            <div>Email: ${r.email}</div>
            <div>Role: ${r.role}</div>
            <div>Signed: ${new Date(r.signed_at).toLocaleString()}</div>
            <div>IP Address: ${r.ip_address || 'N/A'}</div>
            <div>Status: ${r.status}</div>
            <div>Fields Completed: ${r.signature_field_positions?.length || 0}</div>
          </div>
        `).join('')}
      </div>

      <div class="seal">
        DIGITALLY<br>VERIFIED
      </div>

      <div class="footer">
        <p>This certificate verifies that the above-mentioned document has been digitally signed by all listed parties.</p>
        <p>Certificate ID: ${request.id}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>This is a computer-generated certificate and does not require a physical signature.</p>
      </div>
    </body>
    </html>
  `;
}
