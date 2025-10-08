import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

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

    const { letter_id, signature_data } = await req.json()

    // Verify user has access to the letter
    const { data: letter } = await supabaseClient
      .from('legal_letters')
      .select('*')
      .eq('id', letter_id)
      .eq('user_id', user.id)
      .single()

    if (!letter) throw new Error('Letter not found or access denied')

    // Generate SHA-256 hash for verification (UAE law compliance)
    const encoder = new TextEncoder()
    const data = encoder.encode(signature_data + letter_id + user.id + Date.now())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Get client IP and user agent for audit trail
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    const user_agent = req.headers.get('user-agent')

    // Create signature record
    const { data: signature, error } = await supabaseClient
      .from('document_signatures')
      .insert({
        letter_id,
        signer_user_id: user.id,
        signature_data,
        signature_hash,
        ip_address,
        user_agent,
        metadata: {
          compliance: 'UAE Federal Law Decree No. 46/2021',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    // Update letter status to signed
    await supabaseClient
      .from('legal_letters')
      .update({ status: 'signed' })
      .eq('id', letter_id)

    return new Response(
      JSON.stringify({ success: true, signature }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})