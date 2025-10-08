import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('queries_remaining, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')

    // Get credit pricing config
    const { data: pricingConfig } = await supabaseClient
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'credit_pricing')
      .single()

    const tierLimits: { [key: string]: number } = {
      'free': 50,
      'basic': 500,
      'professional': 2000,
      'enterprise': 10000
    }

    const maxCredits = tierLimits[profile.subscription_tier] || 50
    const usagePercentage = ((maxCredits - profile.queries_remaining) / maxCredits) * 100

    const alerts = []
    
    if (usagePercentage >= 90) {
      alerts.push({ level: 'critical', message: '90% of credits used', percentage: usagePercentage })
    } else if (usagePercentage >= 75) {
      alerts.push({ level: 'warning', message: '75% of credits used', percentage: usagePercentage })
    } else if (usagePercentage >= 50) {
      alerts.push({ level: 'info', message: '50% of credits used', percentage: usagePercentage })
    }

    return new Response(
      JSON.stringify({ 
        alerts,
        credits_remaining: profile.queries_remaining,
        total_credits: maxCredits,
        usage_percentage: usagePercentage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})