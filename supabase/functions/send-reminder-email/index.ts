import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { recipient_id } = await req.json();

    // Get recipient details
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("signature_recipients")
      .select(`
        *,
        signature_requests!inner(
          title,
          message,
          expires_at,
          created_by,
          letter_id,
          legal_letters!inner(
            user_id,
            profiles!inner(full_name)
          )
        )
      `)
      .eq("id", recipient_id)
      .single();

    if (recipientError) throw recipientError;

    const senderName = recipient.signature_requests.legal_letters.profiles.full_name || "A user";

    // Send reminder email
    await supabaseClient.functions.invoke("send-signature-request-email", {
      body: {
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        senderName,
        documentTitle: recipient.signature_requests.title,
        message: `Reminder: ${recipient.signature_requests.message || "Please sign this document."}`,
        accessToken: recipient.access_token,
        expiresAt: recipient.signature_requests.expires_at,
        isReminder: true,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
