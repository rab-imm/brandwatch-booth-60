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

    // Get pending payment failures
    const { data: failures } = await supabaseAdmin
      .from('payment_failures')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())

    for (const failure of failures || []) {
      try {
        // Retry invoice payment
        const invoice = await stripe.invoices.retrieve(failure.stripe_invoice_id)
        
        if (invoice.status === 'paid') {
          // Payment succeeded
          await supabaseAdmin
            .from('payment_failures')
            .update({ status: 'recovered' })
            .eq('id', failure.id)
        } else if (failure.failure_count >= 3) {
          // Max retries reached
          await supabaseAdmin
            .from('payment_failures')
            .update({ status: 'failed' })
            .eq('id', failure.id)

          // Notify user (could integrate with notification system)
        } else {
          // Schedule next retry
          const nextRetry = new Date()
          nextRetry.setDate(nextRetry.getDate() + (failure.failure_count * 2)) // Exponential backoff
          
          await supabaseAdmin
            .from('payment_failures')
            .update({
              failure_count: failure.failure_count + 1,
              next_retry_at: nextRetry.toISOString(),
              last_attempt: new Date().toISOString()
            })
            .eq('id', failure.id)
        }
      } catch (error) {
        console.error(`Error processing failure ${failure.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: failures?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})