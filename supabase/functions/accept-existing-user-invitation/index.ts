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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { token } = await req.json()

    if (!token) {
      throw new Error('Invitation token is required')
    }

    console.log('Processing invitation acceptance for existing user:', user.id)

    // Fetch invitation details
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitation_tokens')
      .select(`
        *,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .single()

    if (inviteError || !invitation) {
      console.error('Invitation fetch error:', inviteError)
      throw new Error('Invalid or already accepted invitation')
    }

    // Verify invitation hasn't expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('This invitation has expired')
    }

    // Get user's profile to verify email
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, user_role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Verify email matches
    if (profile.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address')
    }

    // Check if user is already part of this company
    const { data: existingRole } = await supabaseClient
      .from('user_company_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', invitation.company_id)
      .maybeSingle()

    if (existingRole) {
      throw new Error('You are already a member of this company')
    }

    // Add user to company_roles
    const { error: roleError } = await supabaseClient
      .from('user_company_roles')
      .insert({
        user_id: user.id,
        company_id: invitation.company_id,
        role: invitation.role,
        max_credits_per_period: invitation.max_credits_per_period,
      })

    if (roleError) {
      console.error('Error creating company role:', roleError)
      throw new Error('Failed to add user to company')
    }

    // Update user_roles table
    const { error: userRoleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: invitation.role,
      })

    if (userRoleError) {
      console.error('Error creating user role:', userRoleError)
    }

    // Update profile with new role and company
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({
        user_role: invitation.role,
        current_company_id: invitation.company_id,
      })
      .eq('user_id', user.id)

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError)
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabaseClient
      .from('invitation_tokens')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (acceptError) {
      console.error('Error updating invitation:', acceptError)
    }

    // Log activity
    try {
      await supabaseClient
        .from('company_activity_logs')
        .insert({
          company_id: invitation.company_id,
          performed_by: user.id,
          activity_type: 'invitation_accepted',
          target_entity_type: 'user',
          target_entity_id: user.id,
          description: `${profile.email} joined the company as ${invitation.role}`,
          metadata: {
            invitation_id: invitation.id,
            role: invitation.role,
          }
        })
      console.log('Activity logged successfully')
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    // Create notification for inviter
    try {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: invitation.invited_by,
          title: 'Invitation Accepted',
          message: `${profile.email} has joined ${invitation.companies?.name || 'your company'}`,
          type: 'success',
          action_url: `/company-dashboard?tab=team`,
        })
      console.log('Notification created for inviter')
    } catch (notifError) {
      console.error('Failed to create notification:', notifError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully joined the company',
        companyId: invitation.company_id,
        companyName: invitation.companies?.name,
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
