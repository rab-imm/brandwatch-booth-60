import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

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

    // Get or create creator profile
    let { data: creator } = await supabaseClient
      .from('template_creators')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      // Create creator profile
      const { data: newCreator } = await supabaseClient
        .from('template_creators')
        .insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Creator'
        })
        .select()
        .single()
      
      creator = newCreator
    }

    // Create or retrieve Stripe Connect account
    let accountId = creator.stripe_connect_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AE',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      })

      accountId = account.id

      await supabaseClient
        .from('template_creators')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', creator.id)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin')}/creator-portal`,
      return_url: `${req.headers.get('origin')}/creator-portal?success=true`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ success: true, url: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})