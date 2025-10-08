import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get rollover policy
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'credit_rollover_policy')
      .single()

    const policy = config?.config_value as any
    if (!policy?.enabled) {
      return new Response(
        JSON.stringify({ message: 'Rollover disabled' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get all users with remaining credits
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, queries_remaining, subscription_tier')
      .gt('queries_remaining', 0)

    let rolledOver = 0
    const maxRolloverPercentage = policy.max_rollover_percentage / 100

    for (const profile of profiles || []) {
      const currentCredits = profile.queries_remaining
      const rolloverAmount = Math.floor(currentCredits * maxRolloverPercentage)

      if (rolloverAmount > 0) {
        // Create rollover transaction
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: profile.id,
            transaction_type: 'rollover',
            credits_amount: rolloverAmount,
            balance_before: currentCredits,
            balance_after: currentCredits + rolloverAmount,
            metadata: {
              expiry_months: policy.rollover_expiry_months,
              expires_at: new Date(Date.now() + policy.rollover_expiry_months * 30 * 24 * 60 * 60 * 1000)
            }
          })

        rolledOver++
      }
    }

    return new Response(
      JSON.stringify({ success: true, users_processed: rolledOver }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})