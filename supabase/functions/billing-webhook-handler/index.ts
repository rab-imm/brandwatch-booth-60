import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Processing webhook event", { type: event.type, id: event.id });

    // Handle different webhook events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(supabaseClient, event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(supabaseClient, event);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(supabaseClient, event);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(supabaseClient, event);
        break;

      case "customer.created":
        await handleCustomerCreated(supabaseClient, event);
        break;

      default:
        logStep("Unhandled webhook event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in webhook handler", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionChange(supabaseClient: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Handling subscription change", { subscriptionId: subscription.id, status: subscription.status });

  try {
    // Find user by customer ID
    const customer = await findUserByCustomerId(supabaseClient, subscription.customer as string);
    if (!customer) {
      logStep("Customer not found for subscription", { customerId: subscription.customer });
      return;
    }

    // Update subscription status in profiles/companies
    const productId = subscription.items.data[0]?.price?.product as string;
    const status = subscription.status;

    // Update profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_tier: getSubscriptionTier(productId),
        subscription_status: status === 'active' ? 'active' : status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customer.user_id);

    if (profileError) {
      logStep("Error updating profile", { error: profileError });
    }

    // Log subscription event
    const { error: eventError } = await supabaseClient
      .from('subscription_events')
      .insert({
        user_id: customer.user_id,
        stripe_subscription_id: subscription.id,
        event_type: event.type === 'customer.subscription.created' ? 'created' : 'updated',
        new_tier: getSubscriptionTier(productId),
        new_status: status,
        triggered_by: 'stripe_webhook',
        metadata: {
          stripe_event_id: event.id,
          subscription_data: subscription
        }
      });

    if (eventError) {
      logStep("Error logging subscription event", { error: eventError });
    }

    // Create billing transaction record
    if (subscription.latest_invoice) {
      await createBillingTransaction(supabaseClient, {
        user_id: customer.user_id,
        stripe_subscription_id: subscription.id,
        stripe_invoice_id: subscription.latest_invoice as string,
        transaction_type: 'payment',
        amount_aed: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
        status: status === 'active' ? 'succeeded' : 'pending',
        description: `Subscription ${event.type}`,
        metadata: { stripe_event_id: event.id }
      });
    }

  } catch (error) {
    logStep("Error in handleSubscriptionChange", { error: error.message });
    throw error;
  }
}

async function handleSubscriptionCancellation(supabaseClient: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Handling subscription cancellation", { subscriptionId: subscription.id });

  try {
    const customer = await findUserByCustomerId(supabaseClient, subscription.customer as string);
    if (!customer) return;

    // Update profile to free tier
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customer.user_id);

    if (profileError) {
      logStep("Error updating profile on cancellation", { error: profileError });
    }

    // Log cancellation event
    const { error: eventError } = await supabaseClient
      .from('subscription_events')
      .insert({
        user_id: customer.user_id,
        stripe_subscription_id: subscription.id,
        event_type: 'canceled',
        old_tier: getSubscriptionTier(subscription.items.data[0]?.price?.product as string),
        new_tier: 'free',
        old_status: 'active',
        new_status: 'canceled',
        triggered_by: 'stripe_webhook',
        metadata: { stripe_event_id: event.id }
      });

    if (eventError) {
      logStep("Error logging cancellation event", { error: eventError });
    }

    // Create billing alert for cancellation
    await createBillingAlert(supabaseClient, {
      user_id: customer.user_id,
      alert_type: 'subscription_canceled',
      severity: 'medium',
      title: 'Subscription Canceled',
      message: `Customer ${customer.email} has canceled their subscription`,
      metadata: { 
        stripe_subscription_id: subscription.id,
        cancellation_date: new Date().toISOString()
      }
    });

  } catch (error) {
    logStep("Error in handleSubscriptionCancellation", { error: error.message });
    throw error;
  }
}

async function handlePaymentSucceeded(supabaseClient: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Handling payment success", { invoiceId: invoice.id, amount: invoice.amount_paid });

  try {
    const customer = await findUserByCustomerId(supabaseClient, invoice.customer as string);
    if (!customer) return;

    // Reset payment failure count on successful payment
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        payment_failure_count: 0,
        last_payment_failure: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customer.user_id);

    if (profileError) {
      logStep("Error resetting payment failure count", { error: profileError });
    }

    // Create billing transaction
    await createBillingTransaction(supabaseClient, {
      user_id: customer.user_id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      transaction_type: 'payment',
      amount_aed: invoice.amount_paid / 100,
      status: 'succeeded',
      description: `Payment for invoice ${invoice.number}`,
      processed_at: new Date().toISOString(),
      metadata: { stripe_event_id: event.id }
    });

  } catch (error) {
    logStep("Error in handlePaymentSucceeded", { error: error.message });
    throw error;
  }
}

async function handlePaymentFailed(supabaseClient: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Handling payment failure", { invoiceId: invoice.id, attempt: invoice.attempt_count });

  try {
    const customer = await findUserByCustomerId(supabaseClient, invoice.customer as string);
    if (!customer) return;

    // Increment payment failure count
    const { data: currentProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('payment_failure_count')
      .eq('user_id', customer.user_id)
      .single();

    if (fetchError) {
      logStep("Error fetching current profile", { error: fetchError });
      return;
    }

    const newFailureCount = (currentProfile?.payment_failure_count || 0) + 1;

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        payment_failure_count: newFailureCount,
        last_payment_failure: new Date().toISOString(),
        customer_risk_score: Math.min(newFailureCount * 20, 100),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customer.user_id);

    if (profileError) {
      logStep("Error updating payment failure count", { error: profileError });
    }

    // Create billing transaction
    await createBillingTransaction(supabaseClient, {
      user_id: customer.user_id,
      stripe_invoice_id: invoice.id,
      transaction_type: 'payment',
      amount_aed: invoice.amount_due / 100,
      status: 'failed',
      description: `Failed payment for invoice ${invoice.number}`,
      metadata: { 
        stripe_event_id: event.id,
        attempt_count: invoice.attempt_count,
        failure_reason: invoice.last_finalization_error?.message
      }
    });

    // Create billing alert for payment failure
    await createBillingAlert(supabaseClient, {
      user_id: customer.user_id,
      alert_type: 'payment_failed',
      severity: newFailureCount >= 3 ? 'high' : 'medium',
      title: `Payment Failed (Attempt ${invoice.attempt_count})`,
      message: `Payment failed for customer ${customer.email}. Total failures: ${newFailureCount}`,
      metadata: {
        stripe_invoice_id: invoice.id,
        attempt_count: invoice.attempt_count,
        amount_failed: invoice.amount_due / 100
      }
    });

  } catch (error) {
    logStep("Error in handlePaymentFailed", { error: error.message });
    throw error;
  }
}

async function handleCustomerCreated(supabaseClient: any, event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;
  logStep("Handling customer creation", { customerId: customer.id, email: customer.email });

  // This is mainly for logging/analytics purposes
  // The actual user-customer relationship is established during checkout
}

// Helper functions
async function findUserByCustomerId(supabaseClient: any, customerId: string) {
  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('user_id, email')
    .eq('email', (await getCustomerEmail(customerId)));

  if (error || !profiles || profiles.length === 0) {
    return null;
  }

  return profiles[0];
}

async function getCustomerEmail(customerId: string): Promise<string> {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });
  
  const customer = await stripe.customers.retrieve(customerId);
  return (customer as Stripe.Customer).email || '';
}

function getSubscriptionTier(productId: string): string {
  // Map Stripe product IDs to subscription tiers
  const tierMapping: Record<string, string> = {
    'prod_T36q2YZxwwwUnK': 'essential',  // Essential tier
    'prod_T36sS4URaappUY': 'premium',    // Premium tier
    'prod_T36sp38yi1POiY': 'sme',        // SME tier
  };

  return tierMapping[productId] || 'free';
}

async function createBillingTransaction(supabaseClient: any, transaction: any) {
  const { error } = await supabaseClient
    .from('billing_transactions')
    .insert(transaction);

  if (error) {
    logStep("Error creating billing transaction", { error });
  }
}

async function createBillingAlert(supabaseClient: any, alert: any) {
  const { error } = await supabaseClient
    .from('billing_alerts')
    .insert(alert);

  if (error) {
    logStep("Error creating billing alert", { error });
  }
}