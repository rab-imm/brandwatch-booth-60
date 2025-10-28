import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has super_admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Get user ID from email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, current_company_id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = profile.user_id

    // 1. Delete from user_company_roles
    const { error: companyRoleError } = await supabase
      .from('user_company_roles')
      .delete()
      .eq('user_id', userId)

    if (companyRoleError) {
      console.error('Error deleting company roles:', companyRoleError)
    }

    // 2. Remove company_staff from user_roles and add individual if not exists
    const { error: removeRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .in('role', ['company_staff', 'company_manager', 'company_admin'])

    if (removeRoleError) {
      console.error('Error removing company roles:', removeRoleError)
    }

    // Add individual role
    const { error: addRoleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'individual' })
      .select()
      .single()

    if (addRoleError && addRoleError.code !== '23505') { // Ignore duplicate key error
      console.error('Error adding individual role:', addRoleError)
    }

    // 3. Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_company_id: null,
        user_role: 'individual'
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${email} removed from company successfully`,
        userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
