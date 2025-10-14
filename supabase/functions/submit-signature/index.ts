import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SUBMIT-SIGNATURE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { access_token, session_token, field_values } = await req.json();
    
    if (!access_token || !session_token || !field_values) {
      throw new Error("Missing required parameters");
    }

    // Verify recipient by access token
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("signature_recipients")
      .select("*, signature_requests(*)")
      .eq("access_token", access_token)
      .single();

    if (recipientError || !recipient) {
      throw new Error("Invalid access token");
    }

    logStep("Recipient verified", { recipientId: recipient.id });

    // Check if already signed
    if (recipient.signed_at) {
      throw new Error("Document already signed");
    }

    // Verify session token
    const { data: session } = await supabaseClient
      .from("signing_sessions")
      .select("*")
      .eq("session_token", session_token)
      .eq("recipient_id", recipient.id)
      .maybeSingle();

    if (!session) {
      throw new Error("Invalid session token");
    }

    // Get all fields for this recipient
    const { data: fields } = await supabaseClient
      .from("signature_field_positions")
      .select("*")
      .eq("recipient_id", recipient.id);

    // Validate all required fields are completed
    const requiredFields = fields?.filter(f => f.is_required) || [];
    const missingFields = requiredFields.filter(f => !field_values[f.id]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.map(f => f.field_label || f.field_type).join(", ")}`);
    }

    // Insert field values into signature_field_values table
    const fieldValueInserts = Object.entries(field_values).map(([fieldId, value]) => ({
      field_position_id: fieldId,
      field_value: typeof value === 'string' ? value : String(value),
      signed_at: new Date().toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent")
    }));

    const { error: valuesError } = await supabaseClient
      .from("signature_field_values")
      .insert(fieldValueInserts);

    if (valuesError) throw valuesError;

    logStep("Field values inserted", { fieldCount: Object.keys(field_values).length });

    // Mark recipient as signed
    const { error: updateError } = await supabaseClient
      .from("signature_recipients")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        user_agent: req.headers.get("user-agent")
      })
      .eq("id", recipient.id);

    if (updateError) throw updateError;

    // Update session
    await supabaseClient
      .from("signing_sessions")
      .update({
        completed_at: new Date().toISOString()
      })
      .eq("id", session.id);

    // Check if all recipients have signed
    const { data: allRecipients } = await supabaseClient
      .from("signature_recipients")
      .select("*")
      .eq("signature_request_id", recipient.signature_request_id);

    const allSigned = allRecipients?.every(r => r.signed_at) || false;

    if (allSigned) {
      // Update signature request status to completed
      await supabaseClient
        .from("signature_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", recipient.signature_request_id);

      logStep("All recipients signed - request completed");
    }

    logStep("Signature submitted successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Signature submitted successfully",
      all_signed: allSigned
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
