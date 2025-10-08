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

    const { signature_id } = await req.json()

    // Get signature details
    const { data: signature } = await supabaseClient
      .from('document_signatures')
      .select('*, legal_letters(*)')
      .eq('id', signature_id)
      .single()

    if (!signature) throw new Error('Signature not found')

    // Verify signature hasn't been revoked
    const isValid = signature.verification_status === 'valid'
    
    // Check if signature is within valid time frame (UAE compliance)
    const signedDate = new Date(signature.signed_at)
    const currentDate = new Date()
    const daysSinceSigning = Math.floor((currentDate.getTime() - signedDate.getTime()) / (1000 * 60 * 60 * 24))

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        signature: {
          signer_id: signature.signer_user_id,
          signed_at: signature.signed_at,
          verification_status: signature.verification_status,
          days_since_signing: daysSinceSigning,
          compliance: signature.metadata?.compliance,
          ip_address: signature.ip_address
        }
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