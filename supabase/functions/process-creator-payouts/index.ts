import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get revenue sharing config
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'revenue_sharing')
      .single()

    const revenueConfig = config?.config_value as any
    const minimumPayout = revenueConfig?.minimum_payout_aed || 100

    // Get creators eligible for payout
    const { data: creators } = await supabaseAdmin
      .from('template_creators')
      .select('*')
      .gte('pending_earnings_aed', minimumPayout)
      .eq('payout_enabled', true)
      .not('stripe_connect_account_id', 'is', null)

    let payoutsProcessed = 0

    for (const creator of creators || []) {
      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(creator.pending_earnings_aed * 100), // Convert to fils
          currency: 'aed',
          destination: creator.stripe_connect_account_id,
          description: `Creator payout for period`,
        })

        // Record payout
        const periodEnd = new Date()
        const periodStart = new Date()
        periodStart.setMonth(periodStart.getMonth() - 1)

        await supabaseAdmin
          .from('creator_payouts')
          .insert({
            creator_id: creator.id,
            amount_aed: creator.pending_earnings_aed,
            stripe_transfer_id: transfer.id,
            status: 'completed',
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            processed_at: new Date().toISOString()
          })

        // Update creator earnings
        await supabaseAdmin
          .from('template_creators')
          .update({
            total_earnings_aed: creator.total_earnings_aed + creator.pending_earnings_aed,
            pending_earnings_aed: 0
          })
          .eq('id', creator.id)

        payoutsProcessed++
      } catch (error) {
        console.error(`Error processing payout for creator ${creator.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ success: true, payouts_processed: payoutsProcessed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})