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

    const supabase = createClient(
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { email, role, maxCredits, companyId } = await req.json()

    if (!email || !role || !companyId) {
      throw new Error('Email, role, and company ID are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Check for existing invitation
    const { data: existingInvite } = await supabase
      .from('invitation_tokens')
      .select('id, accepted_at')
      .eq('email', email)
      .eq('company_id', companyId)
      .is('accepted_at', null)
      .maybeSingle()

    if (existingInvite) {
      throw new Error('An active invitation already exists for this email')
    }

    // Check if user already exists in this company - FIXED: filter by email
    const { data: existingUserRole } = await supabase
      .from('user_company_roles')
      .select('id, user_id, profiles!inner(email)')
      .eq('company_id', companyId)
      .eq('profiles.email', email)
      .maybeSingle()

    if (existingUserRole) {
      throw new Error('A user with this email is already part of this company')
    }

    // Verify the user is a company admin for this company
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role, current_company_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || (profile.user_role !== 'company_admin' && profile.user_role !== 'super_admin')) {
      throw new Error('Only company admins can send invitations')
    }

    if (profile.user_role === 'company_admin' && profile.current_company_id !== companyId) {
      throw new Error('You can only invite users to your own company')
    }

    // Generate secure token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitation_tokens')
      .insert({
        company_id: companyId,
        invited_by: user.id,
        email,
        role,
        max_credits_per_period: maxCredits || 50,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      throw inviteError
    }

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    const inviteUrl = `${req.headers.get('origin') || 'https://icsttnftxcfgnwhifsdm.supabase.co'}/invite/${token}`

    console.log('Invitation created:', {
      id: invitation.id,
      email,
      token,
      inviteUrl,
      companyName: company?.name,
    })

    // Log activity to company_activity_logs
    try {
      await supabase
        .from('company_activity_logs')
        .insert({
          company_id: companyId,
          performed_by: user.id,
          activity_type: 'user_invited',
          target_entity_type: 'invitation',
          target_entity_id: invitation.id,
          description: `Invited ${email} to join as ${role}`,
          metadata: {
            email,
            role,
            max_credits: maxCredits || 50,
            invite_url: inviteUrl,
          }
        })
      console.log('Activity logged successfully')
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError)
    }

    // Create notification for the inviter
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Invitation Sent',
          message: `Successfully sent invitation to ${email} to join ${company?.name || 'your company'} as ${role}`,
          type: 'success',
          action_url: `/dashboard?tab=team`,
        })
      console.log('Notification created successfully')
    } catch (notifError) {
      console.error('Failed to create notification (non-critical):', notifError)
    }

    // Check if invited email already has an account and notify them
    try {
      const { data: invitedUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle()

      if (invitedUser) {
        await supabase
          .from('notifications')
          .insert({
            user_id: invitedUser.user_id,
            title: 'Company Invitation',
            message: `You've been invited to join ${company?.name || 'a company'} as ${role}. Click to accept.`,
            type: 'info',
            action_url: `/invite/${token}`,
          })
        console.log('Notification created for invited user')
      }
    } catch (notifError) {
      console.error('Failed to create notification for invited user (non-critical):', notifError)
    }

    // TODO: Send email notification here using Resend or similar service
    // For now, we just return the invite URL

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email,
          role,
          inviteUrl,
          expiresAt,
          companyName: company?.name || 'Unknown Company',
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
        error: error.message || 'An error occurred sending the invitation'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
