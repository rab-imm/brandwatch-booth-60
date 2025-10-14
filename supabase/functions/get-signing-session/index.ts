import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GET-SIGNING-SESSION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { access_token } = await req.json();
    if (!access_token) throw new Error("Access token required");

    // Find recipient by access token
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("signature_recipients")
      .select("*, signature_requests(*)")
      .eq("access_token", access_token)
      .single();

    if (recipientError || !recipient) throw new Error("Invalid access token");
    logStep("Recipient found", { recipientId: recipient.id });

    // Check if already signed
    if (recipient.signed_at) {
      return new Response(JSON.stringify({ 
        error: "Document already signed",
        already_signed: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check expiration
    const request = recipient.signature_requests;
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        error: "Signature request has expired",
        expired: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Update viewed_at if first time
    if (!recipient.viewed_at) {
      const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      const user_agent = req.headers.get("user-agent");
      
      await supabaseClient
        .from("signature_recipients")
        .update({ 
          viewed_at: new Date().toISOString(),
          ip_address,
          user_agent
        })
        .eq("id", recipient.id);
    }

    // Get field positions for this recipient
    const { data: fields } = await supabaseClient
      .from("signature_field_positions")
      .select("*")
      .eq("recipient_id", recipient.id)
      .order("page_number", { ascending: true });

    // Get letter content
    const { data: letter } = await supabaseClient
      .from("legal_letters")
      .select("*")
      .eq("id", request.letter_id)
      .single();

    // Create or get session
    const sessionToken = crypto.randomUUID();
    const { data: session } = await supabaseClient
      .from("signing_sessions")
      .insert({
        recipient_id: recipient.id,
        session_token: sessionToken,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        user_agent: req.headers.get("user-agent")
      })
      .select()
      .single();

    logStep("Session created", { sessionId: session.id });

    return new Response(JSON.stringify({ 
      success: true,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
        role: recipient.role
      },
      request: {
        id: request.id,
        title: request.title,
        message: request.message,
        allow_editing: request.allow_editing
      },
      letter,
      fields,
      session_token: sessionToken
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
