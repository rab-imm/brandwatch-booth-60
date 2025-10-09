import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[CREDIT-ROLLOVER] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  try {
    logStep("Function started - Monthly credit rollover with Phase 1 logic");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    
    // Fetch users whose reset date has passed
    const { data: usersToReset, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, queries_used, max_credits_per_period, queries_reset_date, credit_rollover_enabled, rollover_credits, subscription_tier, user_role")
      .lt("queries_reset_date", now.toISOString());

    if (fetchError) {
      throw new Error(`Error fetching profiles: ${fetchError.message}`);
    }

    if (!usersToReset || usersToReset.length === 0) {
      logStep("No users to reset");
      return new Response(JSON.stringify({ message: "No users to reset" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${usersToReset.length} users to reset`);

    let resetCount = 0;
    const errors: any[] = [];

    // Process each user with rollover logic
    for (const profile of usersToReset) {
      try {
        const nextResetDate = new Date(now);
        nextResetDate.setMonth(nextResetDate.getMonth() + 1);

        let newRolloverCredits = 0;
        
        // Calculate rollover credits for eligible users (Premium individual + all business plans)
        if (profile.credit_rollover_enabled) {
          const unusedCredits = Math.max(0, (profile.max_credits_per_period || 0) - (profile.queries_used || 0));
          const maxRollover = (profile.max_credits_per_period || 0) * 2; // Cap at 2x monthly allocation
          const currentRollover = profile.rollover_credits || 0;
          
          // Add unused credits to existing rollover, but cap at maximum
          newRolloverCredits = Math.min(currentRollover + unusedCredits, maxRollover);
          
          logStep(`User ${profile.user_id} rollover calculation`, {
            tier: profile.subscription_tier,
            role: profile.user_role,
            currentRollover,
            unusedCredits,
            newRollover: newRolloverCredits,
            maxRollover
          });
        } else {
          logStep(`User ${profile.user_id} - rollover disabled`);
        }

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            queries_used: 0,
            queries_reset_date: nextResetDate.toISOString(),
            rollover_credits: newRolloverCredits,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error(`Error resetting credits for user ${profile.user_id}:`, updateError);
          errors.push({
            user_id: profile.user_id,
            error: updateError.message,
          });
        } else {
          resetCount++;
          logStep(`Reset credits for user ${profile.user_id}, new rollover: ${newRolloverCredits}`);
          
          // Log transaction
          await supabaseAdmin.from("credit_transactions").insert({
            user_id: profile.user_id,
            amount: newRolloverCredits,
            transaction_type: "rollover",
            description: `Monthly credit reset - ${newRolloverCredits} credits rolled over`,
            metadata: {
              previous_rollover: profile.rollover_credits || 0,
              unused_credits: Math.max(0, (profile.max_credits_per_period || 0) - (profile.queries_used || 0))
            }
          });
        }
      } catch (error) {
        console.error(`Error processing user ${profile.user_id}:`, error);
        errors.push({
          user_id: profile.user_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logStep("Rollover completed", { 
      users_processed: resetCount, 
      errors: errors.length,
      total_attempted: usersToReset.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: resetCount,
        total_users: usersToReset.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});