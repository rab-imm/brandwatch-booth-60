import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[VERIFY-SIGNATURE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { signature_id } = await req.json();
    logStep("Verifying signature", { signatureId: signature_id });

    const { data: signature } = await supabaseClient
      .from("document_signatures")
      .select("*, legal_letters(*)")
      .eq("id", signature_id)
      .single();

    if (!signature) throw new Error("Signature not found");

    const isValid = signature.verification_status === "valid";
    
    const signedDate = new Date(signature.signed_at);
    const currentDate = new Date();
    const daysSinceSigning = Math.floor((currentDate.getTime() - signedDate.getTime()) / (1000 * 60 * 60 * 24));

    logStep("Verification completed", { valid: isValid, daysSinceSigning });

    return new Response(
      JSON.stringify({
        valid: isValid,
        signature: {
          signer_id: signature.signer_user_id,
          signed_at: signature.signed_at,
          verification_status: signature.verification_status,
          days_since_signing: daysSinceSigning,
          compliance: signature.metadata?.compliance,
          ip_address: signature.ip_address,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});