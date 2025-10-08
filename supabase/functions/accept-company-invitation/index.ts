import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token, password, fullName } = await req.json()

    if (!token || !password || !fullName) {
      throw new Error('Token, password, and full name are required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single()

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation')
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired')
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.some(u => u.email === invitation.email)

    if (userExists) {
      throw new Error('User with this email already exists')
    }

    // Create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    console.log('User created:', userData.user.id)

    // Update profile with company role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        user_role: invitation.role,
        current_company_id: invitation.company_id,
      })
      .eq('user_id', userData.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      throw profileError
    }

    // Create user-company role relationship
    const { error: roleError } = await supabaseAdmin
      .from('user_company_roles')
      .insert({
        user_id: userData.user.id,
        company_id: invitation.company_id,
        role: invitation.role,
        max_credits_per_period: invitation.max_credits_per_period,
      })

    if (roleError) {
      console.error('Error creating user-company role:', roleError)
      throw roleError
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('invitation_tokens')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred accepting the invitation'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
