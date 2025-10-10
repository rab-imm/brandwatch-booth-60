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

    const { userRoleId, userId, companyId, newMaxCredits } = await req.json()

    if (!userRoleId || !userId || !companyId || newMaxCredits === undefined) {
      throw new Error('User role ID, user ID, company ID, and new max credits are required')
    }

    if (newMaxCredits < 0) {
      throw new Error('Credits must be a positive number')
    }

    // Verify the requester is a company admin for this company
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role, current_company_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || (profile.user_role !== 'company_admin' && profile.user_role !== 'super_admin')) {
      throw new Error('Only company admins can update user credits')
    }

    if (profile.user_role === 'company_admin' && profile.current_company_id !== companyId) {
      throw new Error('You can only update credits for users in your own company')
    }

    // Get current credits before update
    const { data: currentRole } = await supabase
      .from('user_company_roles')
      .select('max_credits_per_period')
      .eq('id', userRoleId)
      .single()

    // Get user info for logging
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single()

    // Update user credits
    const { error: updateError } = await supabase
      .from('user_company_roles')
      .update({ max_credits_per_period: newMaxCredits })
      .eq('id', userRoleId)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      throw updateError
    }

    // Log activity to company_activity_logs
    try {
      await supabase
        .from('company_activity_logs')
        .insert({
          company_id: companyId,
          performed_by: user.id,
          activity_type: 'credits_allocated',
          target_user_id: userId,
          target_entity_type: 'user_credits',
          target_entity_id: userRoleId,
          description: `Updated ${targetUser?.full_name || targetUser?.email || 'user'}'s credit limit from ${currentRole?.max_credits_per_period || 0} to ${newMaxCredits}`,
          metadata: {
            target_user_email: targetUser?.email,
            target_user_name: targetUser?.full_name,
            old_credits: currentRole?.max_credits_per_period || 0,
            new_credits: newMaxCredits,
          }
        })
      console.log('Activity logged successfully')
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError)
    }

    // Create notification for the admin who performed the action
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Credits Updated',
          message: `Successfully updated credit limit for ${targetUser?.full_name || targetUser?.email || 'user'} to ${newMaxCredits} credits per month`,
          type: 'success',
          action_url: `/dashboard?tab=team`,
        })
      console.log('Notification created successfully')
    } catch (notifError) {
      console.error('Failed to create notification (non-critical):', notifError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User credits updated successfully',
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
        error: error.message || 'An error occurred updating user credits'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
