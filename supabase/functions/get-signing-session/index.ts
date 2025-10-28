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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { access_token } = await req.json();
    
    // Input validation
    if (!access_token || typeof access_token !== 'string') {
      throw new Error("Valid access token required");
    }
    
    if (access_token.length > 100) {
      throw new Error("Invalid access token format");
    }

    // Find recipient by access token
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("signature_recipients")
      .select(`
        *,
        signature_requests!inner(
          *,
          legal_letters!inner(*)
        )
      `)
      .eq("access_token", access_token)
      .maybeSingle();

    if (recipientError || !recipient) {
      logStep("Invalid access token", { error: recipientError?.message });
      throw new Error("Invalid access token");
    }
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
      logStep("Request expired");
      return new Response(JSON.stringify({ 
        error: "Signature request has expired",
        expired: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check sequential signing order if enabled
    if (request.signing_order_enabled) {
      const { data: allRecipients } = await supabaseClient
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", request.id)
        .order("signing_order", { ascending: true });

      const currentOrderIndex = allRecipients?.findIndex(r => r.id === recipient.id) || 0;
      
      // Check if all previous recipients have signed
      const previousRecipients = allRecipients?.slice(0, currentOrderIndex) || [];
      const allPreviousSigned = previousRecipients.every(r => r.signed_at !== null);
      
      if (!allPreviousSigned) {
        logStep("Sequential signing violation", { 
          recipientOrder: recipient.signing_order,
          currentIndex: currentOrderIndex 
        });
        return new Response(JSON.stringify({ 
          error: "Please wait for previous signers to complete their signatures",
          sequential_signing_blocked: true,
          your_order: recipient.signing_order
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    // Update viewed_at and status if first time
    if (!recipient.viewed_at) {
      const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      const user_agent = req.headers.get("user-agent");
      
      await supabaseClient
        .from("signature_recipients")
        .update({ 
          viewed_at: new Date().toISOString(),
          status: "viewed",
          ip_address,
          user_agent
        })
        .eq("id", recipient.id);
      
      logStep("Recipient status updated to viewed");
    }

    // Get field positions for this recipient
    const { data: fields } = await supabaseClient
      .from("signature_field_positions")
      .select("*")
      .eq("recipient_id", recipient.id)
      .order("page_number", { ascending: true });

    // Get letter content
    const letter = recipient.signature_requests.legal_letters;

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
    const errorStack = error instanceof Error ? error.stack : '';
    
    logStep("ERROR", { 
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name 
    });
    
    // Provide user-friendly error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
      userMessage = 'Access denied. This signature link may be invalid or expired.';
    } else if (errorMessage.includes('not found') || errorMessage.includes('null')) {
      userMessage = 'Signature request not found. Please check your link.';
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      debug: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
