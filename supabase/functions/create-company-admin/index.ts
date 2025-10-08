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
    const { email, password, companyName } = await req.json()

    if (!email || !password || !companyName) {
      throw new Error('Email, password, and company name are required')
    }

    // Create Supabase admin client
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

    // Create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: email.split('@')[0],
        signup_type: 'company',
        company_name: companyName
      }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    console.log('User created:', userData.user.id)

    // The handle_new_user trigger should automatically create the profile and company
    // Wait a bit for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify the setup
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, companies(*)')
      .eq('user_id', userData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Company admin account created successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role: profile?.user_role,
          company_id: profile?.current_company_id
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
        error: error.message || 'An error occurred creating the company admin account'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})