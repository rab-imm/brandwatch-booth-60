import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const logStep = (step: string, details?: any) => {
  console.log(`[DUNNING-MANAGEMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    // Get subscriptions with failed payments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: failedTransactions } = await supabaseAdmin
      .from("billing_transactions")
      .select("*")
      .eq("status", "failed")
      .gte("created_at", thirtyDaysAgo.toISOString());

    logStep("Found failed transactions", { count: failedTransactions?.length || 0 });

    let processed = 0;
    let recovered = 0;
    let failed = 0;

    for (const transaction of failedTransactions || []) {
      try {
        if (!transaction.stripe_subscription_id) continue;

        const subscription = await stripe.subscriptions.retrieve(transaction.stripe_subscription_id);
        
        if (subscription.status === "active" || subscription.status === "trialing") {
          // Payment recovered
          await supabaseAdmin
            .from("billing_transactions")
            .update({ status: "completed", processed_at: new Date().toISOString() })
            .eq("id", transaction.id);

          // Create notification
          await supabaseAdmin.from("notifications").insert({
            user_id: transaction.user_id,
            title: "Payment Recovered",
            message: "Your payment has been successfully processed. Thank you!",
            type: "success",
          });

          recovered++;
          logStep("Payment recovered", { transactionId: transaction.id });
        } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
          // Still failed - send reminder
          const daysSinceFailure = Math.floor(
            (Date.now() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceFailure >= 7) {
            // Cancel after 7 days
            await stripe.subscriptions.cancel(subscription.id);
            
            await supabaseAdmin
              .from("billing_transactions")
              .update({ status: "cancelled" })
              .eq("id", transaction.id);

            await supabaseAdmin.from("notifications").insert({
              user_id: transaction.user_id,
              title: "Subscription Cancelled",
              message: "Your subscription has been cancelled due to payment failure. Please update your payment method to reactivate.",
              type: "error",
              action_url: "/pricing",
            });

            failed++;
            logStep("Subscription cancelled", { transactionId: transaction.id });
          } else {
            // Send reminder
            await supabaseAdmin.from("notifications").insert({
              user_id: transaction.user_id,
              title: "Payment Failed",
              message: `Your payment failed ${daysSinceFailure} days ago. Please update your payment method to avoid service interruption.`,
              type: "warning",
              action_url: "/dashboard",
            });

            logStep("Reminder sent", { transactionId: transaction.id, daysSince: daysSinceFailure });
          }
        }

        processed++;
      } catch (error) {
        logStep("ERROR processing transaction", {
          transactionId: transaction.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logStep("Dunning management completed", { processed, recovered, failed });

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        recovered, 
        failed 
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