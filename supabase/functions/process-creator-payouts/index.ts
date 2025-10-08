import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const logStep = (step: string, details?: any) => {
  console.log(`[CREATOR-PAYOUTS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  try {
    logStep("Function started");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: config } = await supabaseAdmin
      .from("system_config")
      .select("config_value")
      .eq("config_key", "revenue_sharing")
      .single();

    const revenueConfig = config?.config_value as any;
    const minimumPayout = revenueConfig?.minimum_payout_aed || 100;
    logStep("Configuration loaded", { minimumPayout });

    // Get pending revenue shares that are ready for payout
    const { data: pendingShares } = await supabaseAdmin
      .from("revenue_shares")
      .select("creator_user_id, SUM(creator_share_aed) as total")
      .eq("status", "pending")
      .group("creator_user_id")
      .gte("total", minimumPayout);

    let payoutsProcessed = 0;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 1);

    for (const share of pendingShares || []) {
      try {
        // Get user profile with Stripe connect account
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("metadata")
          .eq("user_id", share.creator_user_id)
          .single();

        const connectAccountId = profile?.metadata?.stripe_connect_account_id;
        if (!connectAccountId) {
          logStep("Skipping - no Stripe account", { userId: share.creator_user_id });
          continue;
        }

        const transfer = await stripe.transfers.create({
          amount: Math.round(share.total * 100),
          currency: "aed",
          destination: connectAccountId,
          description: `Creator payout for ${periodStart.toDateString()} - ${periodEnd.toDateString()}`,
        });

        await supabaseAdmin.from("creator_payouts").insert({
          creator_user_id: share.creator_user_id,
          payout_period_start: periodStart.toISOString().split('T')[0],
          payout_period_end: periodEnd.toISOString().split('T')[0],
          total_revenue_aed: share.total,
          creator_share_aed: share.total,
          platform_fee_aed: 0,
          status: "completed",
          stripe_transfer_id: transfer.id,
          processed_at: new Date().toISOString(),
        });

        // Mark revenue shares as paid
        await supabaseAdmin
          .from("revenue_shares")
          .update({ status: "paid" })
          .eq("creator_user_id", share.creator_user_id)
          .eq("status", "pending");

        payoutsProcessed++;
        logStep("Payout processed", { userId: share.creator_user_id, amount: share.total });
      } catch (error) {
        logStep("ERROR processing payout", { 
          userId: share.creator_user_id, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    logStep("Payouts completed", { processed: payoutsProcessed });

    return new Response(JSON.stringify({ success: true, payouts_processed: payoutsProcessed }), {
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