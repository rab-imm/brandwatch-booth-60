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
          // Step 1: Comprehensive Input Validation
          console.log('=== STARTING USER CREATION ===');
          console.log('Input data:', { email, full_name, user_role, subscription_tier, max_credits_per_period, company_id });
          
          if (!email || !full_name || !user_role || !subscription_tier || max_credits_per_period === undefined) {
            console.error('Missing required fields');
            return new Response(
              JSON.stringify({ error: 'Missing required fields: email, full_name, user_role, subscription_tier, max_credits_per_period' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate user_role enum
          const validRoles = ['individual', 'company_admin', 'super_admin'];
          if (!validRoles.includes(user_role)) {
            console.error('Invalid user_role:', user_role);
            return new Response(
              JSON.stringify({ error: `Invalid user_role. Must be one of: ${validRoles.join(', ')}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate company_id if provided
          if (company_id) {
            console.log('Validating company_id:', company_id);
            const { data: company, error: companyCheckError } = await supabaseClient
              .from('companies')
              .select('id')
              .eq('id', company_id)
              .maybeSingle();
              
            if (companyCheckError) {
              console.error('Company validation error:', companyCheckError);
              return new Response(
                JSON.stringify({ error: `Error validating company: ${companyCheckError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            if (!company) {
              console.error('Company not found:', company_id);
              return new Response(
                JSON.stringify({ error: 'Company not found' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          // Step 2: Pre-flight Cleanup - Check for existing users and orphaned records
          console.log('=== PRE-FLIGHT CLEANUP ===');
          
          // Check auth users
          const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
          if (listError) {
            console.error('Failed to list existing users:', listError);
            return new Response(
              JSON.stringify({ error: `Failed to check existing users: ${listError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const existingAuthUser = existingUsers.users.find(u => u.email === email);
          if (existingAuthUser) {
            console.log('Found existing auth user:', existingAuthUser.id);
            
            // Check if they have a profile
            const { data: existingProfile, error: profileCheckError } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('user_id', existingAuthUser.id)
              .maybeSingle();
              
            if (profileCheckError) {
              console.error('Error checking existing profile:', profileCheckError);
              return new Response(
                JSON.stringify({ error: `Error checking existing profile: ${profileCheckError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            if (existingProfile) {
              console.log('User already has complete profile');
              return new Response(
                JSON.stringify({ error: 'A user with this email already exists and has a complete profile' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              // Orphaned auth user - clean it up
              console.log('Cleaning up orphaned auth user:', existingAuthUser.id);
              const { error: cleanupError } = await supabaseClient.auth.admin.deleteUser(existingAuthUser.id);
              if (cleanupError) {
                console.error('Failed to cleanup orphaned user:', cleanupError);
                return new Response(
                  JSON.stringify({ error: `Failed to cleanup orphaned user: ${cleanupError.message}` }),
                  { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
              console.log('Successfully cleaned up orphaned auth user');
            }
          }

          // Step 3: Create Auth User
          console.log('=== CREATING AUTH USER ===');
          console.log('Attempting to create auth user with email:', email);
          
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
              JSON.stringify({ error: `Failed to create auth user: ${createError?.message || 'Unknown error'}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          authUserId = authUser.user.id;
          console.log('Auth user created successfully:', authUserId);

          // Step 4: Create Profile with Enhanced Error Handling
          console.log('=== CREATING PROFILE ===');
          const profileData = {
            user_id: authUser.user.id,
            email,
            full_name,
            user_role,
            subscription_tier,
            max_credits_per_period,
            current_company_id: company_id || null
          };
          
          console.log('Creating profile with data:', profileData);
          
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.error('Profile creation failed:', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // Enhanced rollback with retry
            console.log('=== STARTING ROLLBACK ===');
            let rollbackSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                console.log(`Rollback attempt ${attempt}/3`);
                const { error: rollbackError } = await supabaseClient.auth.admin.deleteUser(authUser.user.id);
                if (rollbackError) {
                  console.error(`Rollback attempt ${attempt} failed:`, rollbackError);
                  if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                  }
                } else {
                  console.log(`Rollback successful on attempt ${attempt}`);
                  rollbackSuccess = true;
                  break;
                }
              } catch (rollbackException) {
                console.error(`Rollback attempt ${attempt} exception:`, rollbackException);
              }
            }
            
            if (!rollbackSuccess) {
              console.error('All rollback attempts failed - orphaned auth user may exist');
            }
            
            return new Response(
              JSON.stringify({ 
                error: `Failed to create profile: ${profileError.message}`,
                code: profileError.code,
                details: profileError.details 
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Profile created successfully');

          // Step 5: Create Company Role (if needed)
          if (company_id) {
            console.log('=== CREATING COMPANY ROLE ===');
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
            } else {
              console.log('Company role created successfully');
            }
          }

          // Step 6: Log Activity
          console.log('=== LOGGING ACTIVITY ===');
          try {
            await supabaseClient
              .from('activity_logs')
              .insert({
                user_id: user.id,
                action: 'create_user',
                resource_type: 'user',
                resource_id: authUser.user.id,
                metadata: { created_user_email: email, user_role }
              });
            console.log('Activity logged successfully');
          } catch (logError) {
            console.error('Failed to log activity (non-critical):', logError);
          }

          console.log('=== USER CREATION COMPLETED SUCCESSFULLY ===');
          return new Response(
            JSON.stringify({ success: true, user_id: authUser.user.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('=== UNEXPECTED ERROR IN CREATE_USER ===');
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          // Enhanced rollback with retry in catch block
          if (authUserId) {
            console.log('=== EMERGENCY ROLLBACK ===');
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                console.log(`Emergency rollback attempt ${attempt}/3`);
                const { error: rollbackError } = await supabaseClient.auth.admin.deleteUser(authUserId);
                if (rollbackError) {
                  console.error(`Emergency rollback attempt ${attempt} failed:`, rollbackError);
                  if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                  }
                } else {
                  console.log(`Emergency rollback successful on attempt ${attempt}`);
                  break;
                }
              } catch (rollbackException) {
                console.error(`Emergency rollback attempt ${attempt} exception:`, rollbackException);
              }
            }
          }
          
          return new Response(
            JSON.stringify({ 
              error: `Unexpected error during user creation: ${error.message}`,
              type: error.name
            }),
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