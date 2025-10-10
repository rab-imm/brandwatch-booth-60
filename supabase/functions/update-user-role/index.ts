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

    const { userRoleId, userId, companyId, newRole } = await req.json()

    if (!userRoleId || !userId || !companyId || !newRole) {
      throw new Error('User role ID, user ID, company ID, and new role are required')
    }

    const validRoles = ['company_admin', 'company_manager', 'company_staff']
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }

    // Verify the requester is a company admin for this company
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role, current_company_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || (profile.user_role !== 'company_admin' && profile.user_role !== 'super_admin')) {
      throw new Error('Only company admins can update user roles')
    }

    if (profile.user_role === 'company_admin' && profile.current_company_id !== companyId) {
      throw new Error('You can only update roles for users in your own company')
    }

    // Get current role before update
    const { data: currentRole } = await supabase
      .from('user_company_roles')
      .select('role')
      .eq('id', userRoleId)
      .single()

    // Get user info for logging
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single()

    // Update user role in user_company_roles
    const { error: updateCompanyRoleError } = await supabase
      .from('user_company_roles')
      .update({ role: newRole })
      .eq('id', userRoleId)

    if (updateCompanyRoleError) {
      console.error('Error updating company role:', updateCompanyRoleError)
      throw updateCompanyRoleError
    }

    // Update role in profiles table
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ user_role: newRole })
      .eq('user_id', userId)

    if (updateProfileError) {
      console.error('Error updating profile role:', updateProfileError)
      throw updateProfileError
    }

    // Update user_roles table
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    const { error: insertRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: newRole
      })

    if (insertRoleError) {
      console.error('Error inserting new role:', insertRoleError)
      // Continue anyway - might already exist
    }

    // Log activity to company_activity_logs
    try {
      await supabase
        .from('company_activity_logs')
        .insert({
          company_id: companyId,
          performed_by: user.id,
          activity_type: 'role_changed',
          target_user_id: userId,
          target_entity_type: 'user_role',
          target_entity_id: userRoleId,
          description: `Changed ${targetUser?.full_name || targetUser?.email || 'user'}'s role from ${currentRole?.role || 'unknown'} to ${newRole}`,
          metadata: {
            target_user_email: targetUser?.email,
            target_user_name: targetUser?.full_name,
            old_role: currentRole?.role || 'unknown',
            new_role: newRole,
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
          title: 'Role Updated',
          message: `Successfully changed ${targetUser?.full_name || targetUser?.email || 'user'}'s role to ${newRole}`,
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
        message: 'User role updated successfully',
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
        error: error.message || 'An error occurred updating user role'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
