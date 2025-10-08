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

    const { operation, letter_ids } = await req.json()

    if (!letter_ids || letter_ids.length === 0) {
      throw new Error('No letters specified')
    }

    let result

    switch (operation) {
      case 'archive': {
        result = await supabaseClient
          .from('legal_letters')
          .update({ status: 'archived' })
          .in('id', letter_ids)
          .eq('user_id', user.id)
        break
      }

      case 'delete': {
        result = await supabaseClient
          .from('legal_letters')
          .delete()
          .in('id', letter_ids)
          .eq('user_id', user.id)
        break
      }

      case 'export': {
        // Fetch all letters
        const { data: letters } = await supabaseClient
          .from('legal_letters')
          .select('*')
          .in('id', letter_ids)
          .eq('user_id', user.id)

        return new Response(
          JSON.stringify({ success: true, letters }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'set_expiry': {
        const { expires_at } = await req.json()
        
        // Create expiry tracking for each letter
        const expiryRecords = letter_ids.map((letter_id: string) => ({
          letter_id,
          expires_at,
          auto_archive: true
        }))

        result = await supabaseClient
          .from('document_expiry_tracking')
          .upsert(expiryRecords)
        break
      }

      default:
        throw new Error('Invalid operation')
    }

    if (result?.error) throw result.error

    return new Response(
      JSON.stringify({ success: true, affected: letter_ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})