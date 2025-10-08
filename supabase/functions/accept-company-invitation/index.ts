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

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (fullName.trim().length < 2) {
      throw new Error('Please enter a valid full name')
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

    // Check if user already exists with this email - use profiles table
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('email', invitation.email.toLowerCase())
      .maybeSingle()
    
    if (profileCheckError) {
      console.error('Error checking existing users:', profileCheckError)
      throw new Error('Failed to verify user status')
    }

    if (existingProfile) {
      throw new Error('An account with this email already exists. Please sign in instead.')
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

    // Wait for profile to be created by trigger - increased to 2 seconds
    console.log('Waiting for profile creation by trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify profile exists with retry logic
    let profileFound = false
    let retryCount = 0
    const maxRetries = 3
    let profileData = null

    while (!profileFound && retryCount < maxRetries) {
      const { data: checkProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (checkProfile) {
        profileFound = true
        profileData = checkProfile
        console.log(`Profile found on attempt ${retryCount + 1}`)
      } else {
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`Profile not found, retry ${retryCount}/${maxRetries}...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        }
      }
    }

    if (!profileData) {
      console.error('Profile not created by trigger, creating manually')
      // Manually create profile if trigger failed
      const { error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userData.user.id,
          email: invitation.email,
          full_name: fullName,
          user_role: invitation.role,
          current_company_id: invitation.company_id,
        })

      if (profileCreateError) {
        console.error('Error creating profile:', profileCreateError)
        throw new Error('Failed to create user profile')
      }
    } else {
      // Update existing profile with company role
      console.log('Updating existing profile...')
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
      console.log('Profile updated successfully')
    }

    // Insert into user_roles table
    console.log('Creating user role entry...')
    const { error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: invitation.role
      })

    if (userRoleError) {
      console.error('Error creating user role:', userRoleError)
      // Continue anyway - might already exist or will sync via trigger
    } else {
      console.log('User role created successfully')
    }

    // Create user-company role relationship
    console.log('Creating user-company role...')
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
    console.log('User-company role created successfully')

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
