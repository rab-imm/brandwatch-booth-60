import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-MANAGER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Trial manager request started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'process_trials';

    logStep("Processing action", { action });

    switch (action) {
      case 'create_trial':
        return await createTrial(supabaseClient, req);
      case 'extend_trial':
        return await extendTrial(supabaseClient, req);
      case 'process_trials':
        return await processTrials(supabaseClient);
      case 'convert_trial':
        return await convertTrial(supabaseClient, req);
      case 'get_trial_stats':
        return await getTrialStats(supabaseClient, req);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    logStep("ERROR in trial manager", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createTrial(supabaseClient: any, req: Request) {
  const { user_id, trial_type = 'standard', trial_credits = 50 } = await req.json();
  
  logStep("Creating trial", { user_id, trial_type, trial_credits });

  // Check if user already has an active trial
  const { data: existingTrial } = await supabaseClient
    .from('trial_management')
    .select('*')
    .eq('user_id', user_id)
    .eq('trial_status', 'active')
    .single();

  if (existingTrial) {
    throw new Error("User already has an active trial");
  }

  // Calculate trial end date based on type
  const trialEndDate = new Date();
  switch (trial_type) {
    case 'standard':
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days
      break;
    case 'extended':
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days
      break;
    case 'enterprise':
      trialEndDate.setDate(trialEndDate.getDate() + 60); // 60 days
      break;
    default:
      trialEndDate.setDate(trialEndDate.getDate() + 14);
  }

  // Create trial record
  const { data: trial, error: trialError } = await supabaseClient
    .from('trial_management')
    .insert({
      user_id,
      trial_type,
      trial_end_date: trialEndDate.toISOString(),
      trial_credits_allocated: trial_credits,
      metadata: {
        created_via: 'trial_manager_api',
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (trialError) {
    throw new Error(`Failed to create trial: ${trialError.message}`);
  }

  // Update user profile with trial information
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      trial_start_date: new Date().toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      trial_credits_used: 0,
      subscription_tier: 'trial',
      subscription_status: 'trial_active'
    })
    .eq('user_id', user_id);

  if (profileError) {
    logStep("Error updating profile for trial", { error: profileError });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    trial,
    message: `${trial_type} trial created successfully` 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function extendTrial(supabaseClient: any, req: Request) {
  const { user_id, extension_days = 7, reason = 'Admin extension' } = await req.json();
  
  logStep("Extending trial", { user_id, extension_days, reason });

  // Get current trial
  const { data: currentTrial, error: fetchError } = await supabaseClient
    .from('trial_management')
    .select('*')
    .eq('user_id', user_id)
    .eq('trial_status', 'active')
    .single();

  if (fetchError || !currentTrial) {
    throw new Error("No active trial found for user");
  }

  // Calculate new end date
  const currentEndDate = new Date(currentTrial.trial_end_date);
  currentEndDate.setDate(currentEndDate.getDate() + extension_days);

  // Update trial
  const { error: updateError } = await supabaseClient
    .from('trial_management')
    .update({
      trial_end_date: currentEndDate.toISOString(),
      extension_count: (currentTrial.extension_count || 0) + 1,
      extension_reason: reason,
      trial_status: 'extended',
      metadata: {
        ...currentTrial.metadata,
        last_extension: {
          date: new Date().toISOString(),
          days_added: extension_days,
          reason
        }
      }
    })
    .eq('id', currentTrial.id);

  if (updateError) {
    throw new Error(`Failed to extend trial: ${updateError.message}`);
  }

  // Update profile
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      trial_end_date: currentEndDate.toISOString()
    })
    .eq('user_id', user_id);

  if (profileError) {
    logStep("Error updating profile for trial extension", { error: profileError });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Trial extended by ${extension_days} days`,
    new_end_date: currentEndDate.toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function processTrials(supabaseClient: any) {
  logStep("Processing all trials");

  const now = new Date().toISOString();

  // Find trials that are expiring soon (within 3 days)
  const expiringDate = new Date();
  expiringDate.setDate(expiringDate.getDate() + 3);

  const { data: expiringSoon } = await supabaseClient
    .from('trial_management')
    .select('*')
    .eq('trial_status', 'active')
    .lte('trial_end_date', expiringDate.toISOString())
    .gt('trial_end_date', now);

  // Create alerts for expiring trials
  for (const trial of expiringSoon || []) {
    const daysLeft = Math.ceil((new Date(trial.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if alert already exists
    const { data: existingAlert } = await supabaseClient
      .from('billing_alerts')
      .select('id')
      .eq('user_id', trial.user_id)
      .eq('alert_type', 'trial_expiring')
      .eq('is_resolved', false)
      .single();

    if (!existingAlert) {
      await supabaseClient
        .from('billing_alerts')
        .insert({
          user_id: trial.user_id,
          alert_type: 'trial_expiring',
          severity: daysLeft <= 1 ? 'high' : 'medium',
          title: `Trial Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`,
          message: `Customer trial expires on ${new Date(trial.trial_end_date).toLocaleDateString()}`,
          metadata: {
            trial_id: trial.id,
            days_remaining: daysLeft,
            trial_type: trial.trial_type
          }
        });
    }
  }

  // Find expired trials
  const { data: expiredTrials } = await supabaseClient
    .from('trial_management')
    .select('*')
    .eq('trial_status', 'active')
    .lt('trial_end_date', now);

  // Process expired trials
  for (const trial of expiredTrials || []) {
    // Update trial status
    await supabaseClient
      .from('trial_management')
      .update({
        trial_status: 'expired'
      })
      .eq('id', trial.id);

    // Update user profile
    await supabaseClient
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'trial_expired'
      })
      .eq('user_id', trial.user_id);

    // Create alert for expired trial
    await supabaseClient
      .from('billing_alerts')
      .insert({
        user_id: trial.user_id,
        alert_type: 'trial_expiring',
        severity: 'medium',
        title: 'Trial Expired',
        message: 'Customer trial has expired without conversion',
        metadata: {
          trial_id: trial.id,
          trial_type: trial.trial_type,
          credits_used: trial.trial_credits_used,
          credits_allocated: trial.trial_credits_allocated
        }
      });
  }

  return new Response(JSON.stringify({ 
    success: true,
    processed: {
      expiring_soon: expiringSoon?.length || 0,
      expired: expiredTrials?.length || 0
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function convertTrial(supabaseClient: any, req: Request) {
  const { user_id, target_tier, subscription_id } = await req.json();
  
  logStep("Converting trial", { user_id, target_tier, subscription_id });

  // Get current trial
  const { data: currentTrial, error: fetchError } = await supabaseClient
    .from('trial_management')
    .select('*')
    .eq('user_id', user_id)
    .in('trial_status', ['active', 'extended'])
    .single();

  if (fetchError || !currentTrial) {
    throw new Error("No active trial found for user");
  }

  // Update trial as converted
  const { error: trialError } = await supabaseClient
    .from('trial_management')
    .update({
      trial_status: 'converted',
      conversion_completed: true,
      conversion_date: new Date().toISOString(),
      conversion_target_tier: target_tier,
      metadata: {
        ...currentTrial.metadata,
        conversion: {
          date: new Date().toISOString(),
          target_tier,
          subscription_id
        }
      }
    })
    .eq('id', currentTrial.id);

  if (trialError) {
    throw new Error(`Failed to update trial: ${trialError.message}`);
  }

  // Update user profile
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      subscription_tier: target_tier,
      subscription_status: 'active'
    })
    .eq('user_id', user_id);

  if (profileError) {
    logStep("Error updating profile for conversion", { error: profileError });
  }

  // Log subscription event
  await supabaseClient
    .from('subscription_events')
    .insert({
      user_id,
      stripe_subscription_id: subscription_id,
      event_type: 'created',
      old_tier: 'trial',
      new_tier: target_tier,
      old_status: 'trial_active',
      new_status: 'active',
      triggered_by: 'customer',
      notes: 'Trial conversion',
      metadata: {
        trial_id: currentTrial.id,
        trial_duration_days: Math.ceil((new Date().getTime() - new Date(currentTrial.trial_start_date).getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Trial converted to ${target_tier} tier` 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getTrialStats(supabaseClient: any, req: Request) {
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

  logStep("Getting trial stats");

  // Get trial statistics
  const { data: activeTrials, count: activeCount } = await supabaseClient
    .from('trial_management')
    .select('*', { count: 'exact' })
    .eq('trial_status', 'active');

  const { data: convertedTrials, count: convertedCount } = await supabaseClient
    .from('trial_management')
    .select('*', { count: 'exact' })
    .eq('trial_status', 'converted');

  const { data: expiredTrials, count: expiredCount } = await supabaseClient
    .from('trial_management')
    .select('*', { count: 'exact' })
    .eq('trial_status', 'expired');

  // Conversion rate
  const totalTrials = (convertedCount || 0) + (expiredCount || 0);
  const conversionRate = totalTrials > 0 ? ((convertedCount || 0) / totalTrials) * 100 : 0;

  // Trial type distribution
  const trialDistribution = activeTrials?.reduce((acc: any, trial: any) => {
    acc[trial.trial_type] = (acc[trial.trial_type] || 0) + 1;
    return acc;
  }, {}) || {};

  return new Response(JSON.stringify({
    stats: {
      activeTrials: activeCount || 0,
      convertedTrials: convertedCount || 0,
      expiredTrials: expiredCount || 0,
      conversionRate: Number(conversionRate.toFixed(2)),
      trialDistribution
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}