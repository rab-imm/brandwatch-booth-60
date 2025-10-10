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

    const { userId, companyId } = await req.json()

    if (!userId || !companyId) {
      throw new Error('User ID and company ID are required')
    }

    // Verify the requester is a company admin for this company
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role, current_company_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || (profile.user_role !== 'company_admin' && profile.user_role !== 'super_admin')) {
      throw new Error('Only company admins can remove users')
    }

    if (profile.user_role === 'company_admin' && profile.current_company_id !== companyId) {
      throw new Error('You can only remove users from your own company')
    }

    // Get user info before deletion for logging
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single()

    // Delete user-company role relationship
    const { error: deleteError } = await supabase
      .from('user_company_roles')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (deleteError) {
      console.error('Error removing user:', deleteError)
      throw deleteError
    }

    // Log activity to company_activity_logs
    try {
      await supabase
        .from('company_activity_logs')
        .insert({
          company_id: companyId,
          performed_by: user.id,
          activity_type: 'user_removed',
          target_user_id: userId,
          target_entity_type: 'user',
          target_entity_id: userId,
          description: `Removed ${targetUser?.full_name || targetUser?.email || 'user'} from the company`,
          metadata: {
            removed_user_email: targetUser?.email,
            removed_user_name: targetUser?.full_name,
          }
        })
      console.log('Activity logged successfully')
    } catch (logError) {
      console.error('Failed to log activity (non-critical):', logError)
    }

    // Create notification for the admin who performed the action
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'User Removed',
          message: `Successfully removed ${targetUser?.full_name || targetUser?.email || 'user'} from ${company?.name || 'the company'}`,
          type: 'info',
          action_url: `/dashboard?tab=team`,
        })
      console.log('Notification created successfully')
    } catch (notifError) {
      console.error('Failed to create notification (non-critical):', notifError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User removed successfully',
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
        error: error.message || 'An error occurred removing the user'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
