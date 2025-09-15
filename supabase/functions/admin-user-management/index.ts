import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  full_name: string;
  user_role: 'individual' | 'company_admin' | 'super_admin';
  subscription_tier: string;
  max_credits_per_period: number;
  company_id?: string;
}

interface UpdateUserRequest {
  user_id: string;
  full_name?: string;
  user_role?: 'individual' | 'company_admin' | 'super_admin';
  subscription_tier?: string;
  max_credits_per_period?: number;
  subscription_status?: string;
}

interface CompanyRequest {
  name: string;
  email: string;
  subscription_tier?: string;
  total_credits?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profile?.user_role !== 'super_admin') {
      throw new Error('Insufficient permissions');
    }

    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'create_user': {
        const { email, full_name, user_role, subscription_tier, max_credits_per_period, company_id } = requestData as CreateUserRequest;
        
        let authUserId: string | null = null;
        
        try {
          console.log('Attempting to create user with email:', email);
          
          // Create auth user
          const { data: authUser, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name }
          });

          console.log('Auth user creation result:', { 
            success: !!authUser.user, 
            error: createError?.message,
            userId: authUser.user?.id 
          });

          if (createError || !authUser.user) {
            console.error('Auth user creation failed:', createError);
            return new Response(
              JSON.stringify({ error: `Failed to create user: ${createError?.message || 'Unknown error'}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          authUserId = authUser.user.id;

          // Create profile
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
              user_id: authUser.user.id,
              email,
              full_name,
              user_role,
              subscription_tier,
              max_credits_per_period,
              current_company_id: company_id || null
            });

          if (profileError) {
            console.error('Profile creation failed:', profileError);
            // Rollback auth user creation
            try {
              await supabaseClient.auth.admin.deleteUser(authUser.user.id);
            } catch (rollbackError) {
              console.error('Failed to rollback auth user:', rollbackError);
            }
            return new Response(
              JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // If company_id provided, create company role
          if (company_id) {
            const { error: roleError } = await supabaseClient
              .from('user_company_roles')
              .insert({
                user_id: authUser.user.id,
                company_id,
                role: user_role,
                max_credits_per_period
              });

            if (roleError) {
              console.error('Failed to create company role:', roleError);
              // Don't fail the whole operation for role creation failure
              // The user is still created successfully
            }
          }

          // Log activity
          await supabaseClient.functions.invoke('log-activity', {
            body: {
              user_id: user.id,
              action: 'create_user',
              resource_type: 'user',
              resource_id: authUser.user.id,
              metadata: { created_user_email: email, user_role }
            }
          });

          return new Response(
            JSON.stringify({ success: true, user_id: authUser.user.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Unexpected error in create_user:', error);
          
          // Attempt rollback if we have an authUserId
          if (authUserId) {
            try {
              await supabaseClient.auth.admin.deleteUser(authUserId);
            } catch (rollbackError) {
              console.error('Failed to rollback auth user in catch block:', rollbackError);
            }
          }
          
          return new Response(
            JSON.stringify({ error: `Failed to create user: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'update_user': {
        const { user_id, ...updates } = requestData as UpdateUserRequest;
        
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('user_id', user_id);

        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'update_user',
            resource_type: 'user',
            resource_id: user_id,
            metadata: { updates }
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_user': {
        const { user_id } = requestData;
        
        // Delete auth user (cascades to profiles)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user_id);

        if (deleteError) {
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'delete_user',
            resource_type: 'user',
            resource_id: user_id,
            metadata: {}
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_company': {
        const { name, email, subscription_tier = 'free', total_credits = 1000 } = requestData as CompanyRequest;
        
        const { data: company, error: companyError } = await supabaseClient
          .from('companies')
          .insert({
            name,
            email,
            subscription_tier,
            total_credits
          })
          .select()
          .single();

        if (companyError) {
          throw new Error(`Failed to create company: ${companyError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'create_company',
            resource_type: 'company',
            resource_id: company.id,
            metadata: { company_name: name }
          });

        return new Response(JSON.stringify({ success: true, company }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_company': {
        const { company_id, ...updates } = requestData;
        
        const { error: updateError } = await supabaseClient
          .from('companies')
          .update(updates)
          .eq('id', company_id);

        if (updateError) {
          throw new Error(`Failed to update company: ${updateError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'update_company',
            resource_type: 'company',
            resource_id: company_id,
            metadata: { updates }
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_company': {
        const { company_id } = requestData;
        
        // Check if company has users
        const { data: companyUsers } = await supabaseClient
          .from('user_company_roles')
          .select('user_id')
          .eq('company_id', company_id);

        if (companyUsers && companyUsers.length > 0) {
          throw new Error('Cannot delete company with active users. Please remove all users first.');
        }

        const { error: deleteError } = await supabaseClient
          .from('companies')
          .delete()
          .eq('id', company_id);

        if (deleteError) {
          throw new Error(`Failed to delete company: ${deleteError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'delete_company',
            resource_type: 'company',
            resource_id: company_id,
            metadata: {}
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'pause_company': {
        const { company_id } = requestData;
        
        const { error: pauseError } = await supabaseClient
          .from('companies')
          .update({ subscription_status: 'paused' })
          .eq('id', company_id);

        if (pauseError) {
          throw new Error(`Failed to pause company: ${pauseError.message}`);
        }

        // Log activity
        await supabaseClient
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'pause_company',
            resource_type: 'company',
            resource_id: company_id,
            metadata: {}
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in admin-user-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});