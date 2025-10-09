import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[CREDIT-ROLLOVER] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: config } = await supabaseAdmin
      .from("system_config")
      .select("config_value")
      .eq("config_key", "credit_rollover_policy")
      .single();

    const policy = config?.config_value as any;
    if (!policy?.enabled) {
      logStep("Rollover disabled");
      return new Response(JSON.stringify({ message: "Rollover disabled" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Rollover policy retrieved", { policy });

    // Fetch profiles with unused credits (queries_used tracks credits)
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, queries_used, max_credits_per_period")
      .gt("queries_used", 0);

    let rolledOver = 0;
    const maxRolloverPercentage = policy.max_rollover_percentage / 100;

    for (const profile of profiles || []) {
      const creditsLimit = profile.max_credits_per_period || 0;
      const creditsUsed = profile.queries_used || 0;
      const remainingCredits = creditsLimit - creditsUsed;
      const rolloverAmount = Math.floor(remainingCredits * maxRolloverPercentage);

      if (rolloverAmount > 0) {
        await supabaseAdmin.from("credit_transactions").insert({
          user_id: profile.user_id,
          amount: rolloverAmount,
          transaction_type: "rollover",
          description: `Monthly credit rollover (${maxRolloverPercentage * 100}%)`,
          metadata: {
            expiry_months: policy.rollover_expiry_months,
            expires_at: new Date(Date.now() + policy.rollover_expiry_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });

        rolledOver++;
      }
    }

    logStep("Rollover completed", { users_processed: rolledOver });

    return new Response(JSON.stringify({ success: true, users_processed: rolledOver }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});