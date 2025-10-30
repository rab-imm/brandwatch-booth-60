import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Contact {
  id?: string
  name: string
  email: string
  phone?: string
  notes?: string
  tags?: string[]
  company_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, contact, contactId } = await req.json()

    console.log(`[manage-contacts] User ${user.id} performing action: ${action}`)

    switch (action) {
      case 'list': {
        // Fetch user's contacts
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, contacts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create': {
        if (!contact || !contact.name || !contact.email) {
          throw new Error('Name and email are required')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contact.email)) {
          throw new Error('Invalid email format')
        }

        // Check for duplicates
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('email', contact.email.toLowerCase())
          .single()

        if (existing) {
          throw new Error('Contact with this email already exists')
        }

        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            name: contact.name.trim(),
            email: contact.email.toLowerCase().trim(),
            phone: contact.phone?.trim() || null,
            notes: contact.notes?.trim() || null,
            tags: contact.tags || [],
            company_id: contact.company_id || null,
          })
          .select()
          .single()

        if (error) throw error

        console.log(`[manage-contacts] Contact created: ${newContact.id}`)

        return new Response(
          JSON.stringify({ success: true, contact: newContact }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        if (!contactId) {
          throw new Error('Contact ID is required')
        }

        if (!contact || !contact.name || !contact.email) {
          throw new Error('Name and email are required')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contact.email)) {
          throw new Error('Invalid email format')
        }

        // Check for duplicates (excluding current contact)
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('email', contact.email.toLowerCase())
          .neq('id', contactId)
          .single()

        if (existing) {
          throw new Error('Another contact with this email already exists')
        }

        const { data: updatedContact, error } = await supabase
          .from('contacts')
          .update({
            name: contact.name.trim(),
            email: contact.email.toLowerCase().trim(),
            phone: contact.phone?.trim() || null,
            notes: contact.notes?.trim() || null,
            tags: contact.tags || [],
          })
          .eq('id', contactId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        console.log(`[manage-contacts] Contact updated: ${contactId}`)

        return new Response(
          JSON.stringify({ success: true, contact: updatedContact }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        if (!contactId) {
          throw new Error('Contact ID is required')
        }

        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('user_id', user.id)

        if (error) throw error

        console.log(`[manage-contacts] Contact deleted: ${contactId}`)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('[manage-contacts] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})