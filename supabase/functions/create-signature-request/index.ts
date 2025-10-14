import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-SIGNATURE-REQUEST] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { letter_id, title, message, recipients, fields, expires_in_days, allow_editing, signing_order_enabled } = await req.json();

    // Verify letter ownership
    const { data: letter } = await supabaseClient
      .from("legal_letters")
      .select("*")
      .eq("id", letter_id)
      .eq("user_id", user.id)
      .single();

    if (!letter) throw new Error("Letter not found or access denied");
    logStep("Letter verified", { letterId: letter_id });

    // Create signature request
    const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString() : null;
    
    const { data: signatureRequest, error: requestError } = await supabaseClient
      .from("signature_requests")
      .insert({
        letter_id,
        created_by: user.id,
        title,
        message,
        expires_at: expiresAt,
        allow_editing: allow_editing || false,
        signing_order_enabled: signing_order_enabled || false,
        status: 'draft'
      })
      .select()
      .single();

    if (requestError) throw requestError;
    logStep("Signature request created", { requestId: signatureRequest.id });

    // Create recipients with unique tokens
    const recipientInserts = recipients.map((recipient: any, index: number) => ({
      signature_request_id: signatureRequest.id,
      email: recipient.email,
      name: recipient.name,
      role: recipient.role || 'signer',
      signing_order: signing_order_enabled ? (index + 1) : 1,
      access_token: crypto.randomUUID()
    }));

    const { data: createdRecipients, error: recipientsError } = await supabaseClient
      .from("signature_recipients")
      .insert(recipientInserts)
      .select();

    if (recipientsError) throw recipientsError;
    logStep("Recipients created", { count: createdRecipients.length });

    // Create field positions
    const fieldInserts = fields.map((field: any) => {
      const recipient = createdRecipients.find((r: any) => r.email === field.recipientEmail);
      return {
        signature_request_id: signatureRequest.id,
        recipient_id: recipient.id,
        field_type: field.type,
        page_number: field.page,
        x_position: field.x,
        y_position: field.y,
        width: field.width,
        height: field.height,
        is_required: field.required !== false,
        field_label: field.label,
        placeholder_text: field.placeholder
      };
    });

    if (fieldInserts.length > 0) {
      const { error: fieldsError } = await supabaseClient
        .from("signature_field_positions")
        .insert(fieldInserts);

      if (fieldsError) throw fieldsError;
      logStep("Field positions created", { count: fieldInserts.length });
    }

    // Send email notifications to recipients
    const { data: letterData } = await supabaseClient
      .from("legal_letters")
      .select("user_id, profiles!inner(full_name)")
      .eq("id", letter_id)
      .single();

    const senderName = letterData?.profiles?.full_name || "A user";

    for (const recipient of createdRecipients) {
      try {
        await supabaseClient.functions.invoke("send-signature-request-email", {
          body: {
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            senderName,
            documentTitle: title,
            message,
            accessToken: recipient.access_token,
            expiresAt: expiresAt,
          },
        });
        logStep("Email sent to recipient", { email: recipient.email });
      } catch (emailError) {
        logStep("Failed to send email", { 
          email: recipient.email, 
          error: emailError instanceof Error ? emailError.message : String(emailError) 
        });
        // Continue even if email fails - signature request is created
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      signature_request: signatureRequest,
      recipients: createdRecipients
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
