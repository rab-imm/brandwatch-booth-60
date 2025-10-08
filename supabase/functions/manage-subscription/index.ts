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

    const { action, subscription_id, tier_id, billing_cycle, pause_reason } = await req.json()

    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        // Update subscription tier
        const { data: newTier } = await supabaseClient
          .from('subscription_tiers')
          .select('*')
          .eq('id', tier_id)
          .single()

        if (!newTier) throw new Error('Tier not found')

        // Update user's subscription
        const { data: profile } = await supabaseClient
          .from('profiles')
          .update({ subscription_tier: newTier.tier_name })
          .eq('id', user.id)
          .select()
          .single()

        return new Response(
          JSON.stringify({ success: true, tier: newTier, profile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'pause': {
        // Create pause record
        const { data: pause } = await supabaseClient
          .from('subscription_pauses')
          .insert({
            user_id: user.id,
            reason: pause_reason,
            resume_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()

        return new Response(
          JSON.stringify({ success: true, pause }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'resume': {
        // Update pause record
        const { data: pause } = await supabaseClient
          .from('subscription_pauses')
          .update({ ended_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('ended_at', null)
          .select()
          .single()

        return new Response(
          JSON.stringify({ success: true, pause }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})