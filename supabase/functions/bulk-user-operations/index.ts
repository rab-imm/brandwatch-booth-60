import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[BULK-USER-OPS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin access required");
    }
    logStep("Super admin verified", { userId: user.id });

    const { operation, user_ids, data: operationData } = await req.json();
    logStep("Bulk operation request", { operation, user_count: user_ids.length });

    const results = [];
    const errors = [];

    for (const targetUserId of user_ids) {
      try {
        switch (operation) {
          case "allocate_credits": {
            const { credits } = operationData;
            await supabaseClient.from("credit_transactions").insert({
              user_id: targetUserId,
              amount: credits,
              transaction_type: "bonus",
              description: `Bulk credit allocation by admin`,
            });
            results.push({ user_id: targetUserId, success: true });
            break;
          }

          case "suspend": {
            await supabaseClient
              .from("profiles")
              .update({ account_status: "suspended" })
              .eq("user_id", targetUserId);
            results.push({ user_id: targetUserId, success: true });
            break;
          }

          case "activate": {
            await supabaseClient
              .from("profiles")
              .update({ account_status: "active" })
              .eq("user_id", targetUserId);
            results.push({ user_id: targetUserId, success: true });
            break;
          }

          case "change_role": {
            const { new_role } = operationData;
            await supabaseClient
              .from("user_roles")
              .upsert({ user_id: targetUserId, role: new_role });
            results.push({ user_id: targetUserId, success: true });
            break;
          }

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (err) {
        errors.push({
          user_id: targetUserId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logStep("Bulk operation completed", { 
      successful: results.length, 
      failed: errors.length 
    });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        errors,
        summary: {
          total: user_ids.length,
          successful: results.length,
          failed: errors.length,
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