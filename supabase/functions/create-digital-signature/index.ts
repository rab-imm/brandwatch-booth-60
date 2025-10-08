import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-SIGNATURE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { letter_id, signature_data } = await req.json();

    const { data: letter } = await supabaseClient
      .from("legal_letters")
      .select("*")
      .eq("id", letter_id)
      .eq("user_id", user.id)
      .single();

    if (!letter) throw new Error("Letter not found or access denied");
    logStep("Letter verified", { letterId: letter_id });

    const encoder = new TextEncoder();
    const data = encoder.encode(signature_data + letter_id + user.id + Date.now());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature_hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const user_agent = req.headers.get("user-agent");

    const { data: signature, error } = await supabaseClient
      .from("document_signatures")
      .insert({
        letter_id,
        signer_user_id: user.id,
        signature_data,
        signature_hash,
        ip_address,
        user_agent,
        metadata: {
          compliance: "UAE Federal Law Decree No. 46/2021",
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseClient
      .from("legal_letters")
      .update({ status: "signed", signed_at: new Date().toISOString() })
      .eq("id", letter_id);

    logStep("Signature created", { signatureId: signature.id });

    return new Response(JSON.stringify({ success: true, signature }), {
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