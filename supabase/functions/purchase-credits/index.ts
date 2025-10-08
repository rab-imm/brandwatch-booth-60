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

    const { credits_amount } = await req.json()
    
    // Calculate price (example: 1 AED per credit)
    const price_aed = credits_amount * 1

    // Create purchase record
    const { data: purchase } = await supabaseClient
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        credits_amount,
        price_aed,
        status: 'pending'
      })
      .select()
      .single()

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price_aed * 100), // Convert to fils
      currency: 'aed',
      metadata: {
        user_id: user.id,
        purchase_id: purchase.id,
        credits_amount: credits_amount.toString()
      }
    })

    // Update purchase with stripe payment intent ID
    await supabaseClient
      .from('credit_purchases')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', purchase.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        client_secret: paymentIntent.client_secret,
        purchase_id: purchase.id
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