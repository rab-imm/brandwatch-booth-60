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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (profile?.user_role !== 'super_admin') {
      throw new Error('Forbidden: Super admin access required')
    }

    const { operation, user_ids, data } = await req.json()

    let result

    switch (operation) {
      case 'allocate_credits': {
        const { credits } = data
        result = await supabaseAdmin
          .from('profiles')
          .update({ queries_remaining: credits })
          .in('id', user_ids)
        break
      }

      case 'change_role': {
        const { role } = data
        result = await supabaseAdmin
          .from('profiles')
          .update({ user_role: role })
          .in('id', user_ids)
        break
      }

      case 'change_subscription': {
        const { subscription_tier } = data
        result = await supabaseAdmin
          .from('profiles')
          .update({ subscription_tier })
          .in('id', user_ids)
        break
      }

      case 'suspend': {
        result = await supabaseAdmin
          .from('profiles')
          .update({ account_status: 'suspended' })
          .in('id', user_ids)
        break
      }

      case 'activate': {
        result = await supabaseAdmin
          .from('profiles')
          .update({ account_status: 'active' })
          .in('id', user_ids)
        break
      }

      default:
        throw new Error('Invalid operation')
    }

    if (result?.error) throw result.error

    return new Response(
      JSON.stringify({ success: true, affected: user_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})