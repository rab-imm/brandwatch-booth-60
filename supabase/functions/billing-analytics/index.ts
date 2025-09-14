import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-ANALYTICS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Analytics request started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.user_role !== 'super_admin') {
      throw new Error("Unauthorized: Super admin access required");
    }

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'overview';
    const startDate = url.searchParams.get('start_date') || getDefaultStartDate();
    const endDate = url.searchParams.get('end_date') || new Date().toISOString();

    logStep("Generating analytics report", { reportType, startDate, endDate });

    let analyticsData;

    switch (reportType) {
      case 'overview':
        analyticsData = await generateOverviewReport(supabaseClient, startDate, endDate);
        break;
      case 'revenue':
        analyticsData = await generateRevenueReport(supabaseClient, startDate, endDate);
        break;
      case 'customers':
        analyticsData = await generateCustomerReport(supabaseClient, startDate, endDate);
        break;
      case 'churn':
        analyticsData = await generateChurnReport(supabaseClient, startDate, endDate);
        break;
      case 'trial_conversion':
        analyticsData = await generateTrialConversionReport(supabaseClient, startDate, endDate);
        break;
      case 'payment_health':
        analyticsData = await generatePaymentHealthReport(supabaseClient, startDate, endDate);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in billing analytics", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateOverviewReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating overview report");

  // Get current subscription stats
  const { data: subscriptionStats } = await supabaseClient
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .neq('subscription_tier', 'free');

  // Get MRR calculation
  const { data: mrrData } = await supabaseClient
    .from('billing_transactions')
    .select('amount_aed')
    .eq('transaction_type', 'payment')
    .eq('status', 'succeeded')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Get total revenue
  const totalRevenue = mrrData?.reduce((sum, transaction) => sum + Number(transaction.amount_aed), 0) || 0;

  // Get active trials
  const { data: activeTrials, count: activeTrialsCount } = await supabaseClient
    .from('trial_management')
    .select('*', { count: 'exact' })
    .eq('trial_status', 'active');

  // Get recent payment failures
  const { data: paymentFailures, count: failureCount } = await supabaseClient
    .from('billing_alerts')
    .select('*', { count: 'exact' })
    .eq('alert_type', 'payment_failed')
    .eq('is_resolved', false)
    .gte('created_at', startDate);

  // Calculate subscription distribution
  const subscriptionDistribution = subscriptionStats?.reduce((acc: any, sub: any) => {
    const tier = sub.subscription_tier || 'free';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    overview: {
      totalRevenue,
      activeSubscriptions: subscriptionStats?.length || 0,
      activeTrials: activeTrialsCount || 0,
      paymentFailures: failureCount || 0,
      subscriptionDistribution,
      reportPeriod: { startDate, endDate }
    }
  };
}

async function generateRevenueReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating revenue report");

  // Monthly revenue breakdown
  const { data: monthlyRevenue } = await supabaseClient
    .rpc('get_monthly_revenue', {
      start_date: startDate,
      end_date: endDate
    });

  // Revenue by subscription tier
  const { data: revenueByTier } = await supabaseClient
    .from('billing_transactions')
    .select(`
      amount_aed,
      profiles!billing_transactions_user_id_fkey (subscription_tier)
    `)
    .eq('transaction_type', 'payment')
    .eq('status', 'succeeded')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const tierRevenue = revenueByTier?.reduce((acc: any, transaction: any) => {
    const tier = transaction.profiles?.subscription_tier || 'unknown';
    acc[tier] = (acc[tier] || 0) + Number(transaction.amount_aed);
    return acc;
  }, {}) || {};

  // Failed revenue (lost due to payment failures)
  const { data: failedPayments } = await supabaseClient
    .from('billing_transactions')
    .select('amount_aed')
    .eq('transaction_type', 'payment')
    .eq('status', 'failed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const lostRevenue = failedPayments?.reduce((sum, transaction) => sum + Number(transaction.amount_aed), 0) || 0;

  return {
    revenue: {
      monthlyRevenue: monthlyRevenue || [],
      revenueByTier: tierRevenue,
      lostRevenue,
      reportPeriod: { startDate, endDate }
    }
  };
}

async function generateCustomerReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating customer report");

  // New customers in period
  const { data: newCustomers, count: newCustomerCount } = await supabaseClient
    .from('profiles')
    .select('*', { count: 'exact' })
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Customer lifetime value by tier
  const { data: customerLTV } = await supabaseClient
    .from('billing_transactions')
    .select(`
      user_id,
      amount_aed,
      profiles!billing_transactions_user_id_fkey (subscription_tier, created_at)
    `)
    .eq('transaction_type', 'payment')
    .eq('status', 'succeeded');

  // Group by user and calculate LTV
  const ltvByTier = customerLTV?.reduce((acc: any, transaction: any) => {
    const tier = transaction.profiles?.subscription_tier || 'free';
    if (!acc[tier]) {
      acc[tier] = { totalRevenue: 0, customerCount: new Set() };
    }
    acc[tier].totalRevenue += Number(transaction.amount_aed);
    acc[tier].customerCount.add(transaction.user_id);
    return acc;
  }, {}) || {};

  // Convert sets to counts and calculate average LTV
  Object.keys(ltvByTier).forEach(tier => {
    const customerCount = ltvByTier[tier].customerCount.size;
    ltvByTier[tier] = {
      averageLTV: customerCount > 0 ? ltvByTier[tier].totalRevenue / customerCount : 0,
      totalCustomers: customerCount,
      totalRevenue: ltvByTier[tier].totalRevenue
    };
  });

  // High-risk customers (high payment failure count)
  const { data: riskCustomers } = await supabaseClient
    .from('profiles')
    .select('user_id, email, full_name, payment_failure_count, customer_risk_score, subscription_tier')
    .gt('customer_risk_score', 50)
    .order('customer_risk_score', { ascending: false })
    .limit(20);

  return {
    customers: {
      newCustomers: newCustomerCount || 0,
      lifetimeValueByTier: ltvByTier,
      highRiskCustomers: riskCustomers || [],
      reportPeriod: { startDate, endDate }
    }
  };
}

async function generateChurnReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating churn report");

  // Cancellations in period
  const { data: cancellations, count: churnCount } = await supabaseClient
    .from('subscription_events')
    .select('*', { count: 'exact' })
    .eq('event_type', 'canceled')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Churn by tier
  const churnByTier = cancellations?.reduce((acc: any, event: any) => {
    const tier = event.old_tier || 'unknown';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {}) || {};

  // Get total subscribers at start of period for churn rate calculation
  const { data: totalSubscribers, count: totalSubscriberCount } = await supabaseClient
    .from('profiles')
    .select('*', { count: 'exact' })
    .neq('subscription_tier', 'free')
    .lte('created_at', startDate);

  const churnRate = totalSubscriberCount > 0 ? (churnCount || 0) / totalSubscriberCount * 100 : 0;

  return {
    churn: {
      churnCount: churnCount || 0,
      churnRate: Number(churnRate.toFixed(2)),
      churnByTier,
      totalSubscribersAtPeriodStart: totalSubscriberCount || 0,
      reportPeriod: { startDate, endDate }
    }
  };
}

async function generateTrialConversionReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating trial conversion report");

  // Trials that ended in this period
  const { data: endedTrials } = await supabaseClient
    .from('trial_management')
    .select('*')
    .gte('trial_end_date', startDate)
    .lte('trial_end_date', endDate);

  // Trials that converted
  const convertedTrials = endedTrials?.filter(trial => trial.conversion_completed) || [];
  const conversionRate = endedTrials?.length > 0 ? (convertedTrials.length / endedTrials.length) * 100 : 0;

  // Conversion by target tier
  const conversionByTier = convertedTrials.reduce((acc: any, trial: any) => {
    const tier = trial.conversion_target_tier || 'unknown';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  // Active trials by type
  const { data: activeTrialsByType } = await supabaseClient
    .from('trial_management')
    .select('trial_type')
    .eq('trial_status', 'active');

  const activeTrialsDistribution = activeTrialsByType?.reduce((acc: any, trial: any) => {
    const type = trial.trial_type || 'standard';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    trialConversion: {
      totalTrialsEnded: endedTrials?.length || 0,
      conversions: convertedTrials.length,
      conversionRate: Number(conversionRate.toFixed(2)),
      conversionByTier,
      activeTrialsDistribution,
      reportPeriod: { startDate, endDate }
    }
  };
}

async function generatePaymentHealthReport(supabaseClient: any, startDate: string, endDate: string) {
  logStep("Generating payment health report");

  // Payment success/failure rates
  const { data: allPayments } = await supabaseClient
    .from('billing_transactions')
    .select('status')
    .eq('transaction_type', 'payment')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const paymentStats = allPayments?.reduce((acc: any, payment: any) => {
    acc[payment.status] = (acc[payment.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalPayments = allPayments?.length || 0;
  const successRate = totalPayments > 0 ? ((paymentStats.succeeded || 0) / totalPayments) * 100 : 0;

  // Customers with recent payment failures
  const { data: customersWithFailures } = await supabaseClient
    .from('profiles')
    .select('user_id, email, full_name, payment_failure_count, last_payment_failure')
    .gt('payment_failure_count', 0)
    .order('payment_failure_count', { ascending: false })
    .limit(50);

  // Recent billing alerts
  const { data: recentAlerts } = await supabaseClient
    .from('billing_alerts')
    .select('*')
    .in('alert_type', ['payment_failed', 'high_risk_customer'])
    .eq('is_resolved', false)
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    paymentHealth: {
      paymentStats,
      successRate: Number(successRate.toFixed(2)),
      customersWithFailures: customersWithFailures || [],
      recentAlerts: recentAlerts || [],
      reportPeriod: { startDate, endDate }
    }
  };
}

function getDefaultStartDate(): string {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return thirtyDaysAgo.toISOString();
}