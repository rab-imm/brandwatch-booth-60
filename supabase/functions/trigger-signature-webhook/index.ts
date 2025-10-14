import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[TRIGGER-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { signature_request_id, event_type } = await req.json();

    // Validate inputs
    if (!signature_request_id || !event_type) {
      throw new Error("Missing required parameters");
    }

    // Get signature request with webhook URL
    const { data: request, error: requestError } = await supabaseClient
      .from("signature_requests")
      .select(`
        *,
        signature_recipients(*)
      `)
      .eq("id", signature_request_id)
      .maybeSingle();

    if (requestError || !request) {
      logStep("Request not found", { error: requestError?.message });
      throw new Error("Signature request not found");
    }

    // Check if webhook is configured and event should trigger
    if (!request.webhook_url) {
      logStep("No webhook configured");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No webhook configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const webhookEvents = request.webhook_events || ['completed'];
    if (!webhookEvents.includes(event_type)) {
      logStep("Event not subscribed", { event_type, subscribed: webhookEvents });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Event not subscribed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prepare webhook payload
    const payload = {
      event: event_type,
      timestamp: new Date().toISOString(),
      signature_request: {
        id: request.id,
        title: request.title,
        status: request.status,
        created_at: request.created_at,
        completed_at: request.completed_at,
        letter_id: request.letter_id,
      },
      recipients: request.signature_recipients.map((r: any) => ({
        email: r.email,
        name: r.name,
        status: r.status,
        signed_at: r.signed_at,
      })),
    };

    logStep("Triggering webhook", { url: request.webhook_url, event: event_type });

    // Trigger webhook with retry logic
    let response;
    let error_message = null;
    let retry_count = 0;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        response = await fetch(request.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "LegalAI-Signatures/1.0",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          logStep("Webhook delivered successfully", { attempt: i + 1 });
          break;
        } else {
          error_message = `HTTP ${response.status}: ${await response.text()}`;
          retry_count = i + 1;
          if (i < MAX_RETRIES - 1) {
            await new Deno.sleep(1000 * Math.pow(2, i)); // Exponential backoff
          }
        }
      } catch (err) {
        error_message = err instanceof Error ? err.message : String(err);
        retry_count = i + 1;
        if (i < MAX_RETRIES - 1) {
          await new Deno.sleep(1000 * Math.pow(2, i));
        }
      }
    }

    // Log webhook delivery
    await supabaseClient.from("signature_webhook_logs").insert({
      signature_request_id: request.id,
      event_type,
      webhook_url: request.webhook_url,
      payload,
      response_status: response?.status,
      response_body: response ? await response.text() : null,
      delivered_at: response?.ok ? new Date().toISOString() : null,
      error_message,
      retry_count,
    });

    if (!response?.ok) {
      logStep("Webhook delivery failed", { error_message, retry_count });
      throw new Error(`Webhook delivery failed: ${error_message}`);
    }

    logStep("Webhook triggered successfully");

    return new Response(JSON.stringify({ 
      success: true,
      delivered: true
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
