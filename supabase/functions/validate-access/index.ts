import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  resource: string
  action: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { resource, action }: ValidationRequest = await req.json()

    // Get user roles from user_roles table (NOT from profiles)
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const roles = userRoles?.map(r => r.role) || []

    // Check permissions based on resource and action
    const hasPermission = checkPermission(roles, resource, action)

    return new Response(
      JSON.stringify({ 
        allowed: hasPermission,
        user_id: user.id,
        roles: roles
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in validate-access:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Check if the user has permission to perform an action on a resource
 */
function checkPermission(roles: string[], resource: string, action: string): boolean {
  // Super admins have access to everything
  if (roles.includes('super_admin')) {
    return true
  }

  // Define permission matrix
  const permissions: Record<string, Record<string, string[]>> = {
    dashboard: {
      view: ['individual', 'company_staff', 'company_manager', 'company_admin'],
      edit: ['individual', 'company_staff', 'company_manager', 'company_admin']
    },
    company_admin: {
      view: ['company_admin'],
      edit: ['company_admin']
    },
    company_user: {
      view: ['company_staff', 'company_manager', 'company_admin'],
      edit: ['company_staff', 'company_manager', 'company_admin']
    },
    admin: {
      view: ['super_admin'],
      edit: ['super_admin']
    },
    letters: {
      view: ['individual', 'company_staff', 'company_manager', 'company_admin'],
      create: ['individual', 'company_staff', 'company_manager', 'company_admin'],
      edit: ['individual', 'company_staff', 'company_manager', 'company_admin'],
      delete: ['individual', 'company_staff', 'company_manager', 'company_admin']
    },
    team_members: {
      view: ['company_manager', 'company_admin'],
      invite: ['company_admin'],
      remove: ['company_admin'],
      edit: ['company_admin']
    }
  }

  // Check if resource and action exist in permissions
  if (!permissions[resource] || !permissions[resource][action]) {
    console.warn(`Unknown resource/action: ${resource}/${action}`)
    return false
  }

  // Check if user has any of the required roles
  const requiredRoles = permissions[resource][action]
  return roles.some(role => requiredRoles.includes(role))
}