import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  full_name: string;
  user_role: 'individual' | 'company_admin' | 'super_admin' | 'company_manager' | 'company_staff';
  subscription_tier: string;
  max_credits_per_period: number;
  company_id?: string;
}

interface UpdateUserRequest {
  user_id: string;
  full_name?: string;
  user_role?: 'individual' | 'company_admin' | 'super_admin' | 'company_manager' | 'company_staff';
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
          const validRoles = ['individual', 'company_admin', 'super_admin', 'company_manager', 'company_staff'];
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

          // Validate company_id for company roles
          if (['company_admin', 'company_manager', 'company_staff'].includes(user_role) && !company_id) {
            console.error(`Company ID required for role: ${user_role}`);
            return new Response(
              JSON.stringify({ error: `Company ID is required for role: ${user_role}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Step 2: Pre-flight Cleanup - Check for existing users
          console.log('=== PRE-FLIGHT CLEANUP ===');
          
          // Check profiles table (instead of auth.users to avoid API errors)
          const { data: existingProfile, error: profileCheckError } = await supabaseClient
            .from('profiles')
            .select('user_id, email, user_role')
            .eq('email', email)
            .maybeSingle();
          
          if (profileCheckError) {
            console.error('Failed to check existing profile:', profileCheckError);
            return new Response(
              JSON.stringify({ error: `Failed to check existing users: ${profileCheckError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (existingProfile) {
            console.log('Found existing user profile:', existingProfile.user_id);
            console.log('User already has complete profile');
            return new Response(
              JSON.stringify({ error: 'A user with this email already exists and has a complete profile' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
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

          // Step 4: Update Profile (since trigger already created basic profile)
          console.log('=== UPDATING PROFILE ===');
          const profileData = {
            email,
            full_name,
            user_role,
            subscription_tier,
            max_credits_per_period,
            current_company_id: company_id || null
          };
          
          console.log('Updating profile with data:', profileData);
          
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update(profileData)
            .eq('user_id', authUser.user.id);

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

          // Step 5: Insert into user_roles table
          console.log('=== CREATING USER ROLE ===');
          const { error: roleInsertError } = await supabaseClient
            .from('user_roles')
            .insert({
              user_id: authUser.user.id,
              role: user_role
            });

          if (roleInsertError) {
            console.error('Failed to create user role:', {
              code: roleInsertError.code,
              message: roleInsertError.message,
              details: roleInsertError.details,
            });
            // Continue anyway - role might already exist or will sync via trigger
          } else {
            console.log('User role created successfully');
          }

          // Step 6: Create Company Role (if needed) with UPSERT logic
          if (company_id) {
            console.log('=== CREATING/UPDATING COMPANY ROLE ===');
            
            // Check if user already has a role in this company
            const { data: existingRole, error: roleCheckError } = await supabaseClient
              .from('user_company_roles')
              .select('id, role')
              .eq('user_id', authUser.user.id)
              .eq('company_id', company_id)
              .maybeSingle();
              
            if (roleCheckError) {
              console.error('Error checking existing company role:', roleCheckError);
              // Don't fail the whole operation for role check failure
            } else if (existingRole) {
              console.log('User already has role in company, updating...', existingRole);
              const { error: roleUpdateError } = await supabaseClient
                .from('user_company_roles')
                .update({
                  role: user_role,
                  max_credits_per_period
                })
                .eq('id', existingRole.id);
                
              if (roleUpdateError) {
                console.error('Failed to update company role:', roleUpdateError);
              } else {
                console.log('Company role updated successfully');
              }
            } else {
              console.log('Creating new company role...');
              const { error: roleError } = await supabaseClient
                .from('user_company_roles')
                .insert({
                  user_id: authUser.user.id,
                  company_id,
                  role: user_role,
                  max_credits_per_period
                });

              if (roleError) {
                console.error('Failed to create company role:', {
                  code: roleError.code,
                  message: roleError.message,
                  details: roleError.details,
                  hint: roleError.hint
                });
                // Don't fail the whole operation for role creation failure
              } else {
                console.log('Company role created successfully');
              }
            }
          }

          // Step 7: Log Activity
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
        console.log('=== STARTING USER UPDATE ===');
        const { user_id, ...updates } = requestData as UpdateUserRequest;
        console.log('Update user request:', { user_id, updates });
        
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('user_id', user_id);

        if (updateError) {
          console.error('User update failed:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          return new Response(
            JSON.stringify({ 
              error: `Failed to update user: ${updateError.message}`,
              code: updateError.code,
              details: updateError.details 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('User updated successfully');

        // Log activity
        try {
          await supabaseClient
            .from('activity_logs')
            .insert({
              user_id: user.id,
              action: 'update_user',
              resource_type: 'user',
              resource_id: user_id,
              metadata: { updates }
            });
          console.log('Activity logged successfully');
        } catch (logError) {
          console.error('Failed to log activity (non-critical):', logError);
        }

        console.log('=== USER UPDATE COMPLETED SUCCESSFULLY ===');
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
        console.log('=== STARTING COMPANY CREATION ===');
        const { name, email, subscription_tier = 'free', total_credits = 1000 } = requestData as CompanyRequest;
        console.log('Company data:', { name, email, subscription_tier, total_credits });
        
        // Check for existing company with same name or email
        const { data: existingCompany, error: checkError } = await supabaseClient
          .from('companies')
          .select('id, name, email')
          .or(`name.eq.${name},email.eq.${email}`)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking existing company:', checkError);
          return new Response(
            JSON.stringify({ error: `Error checking existing company: ${checkError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (existingCompany) {
          console.error('Company already exists:', existingCompany);
          return new Response(
            JSON.stringify({ 
              error: `Company already exists with ${existingCompany.name === name ? 'name' : 'email'}: ${existingCompany.name === name ? name : email}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
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
          console.error('Company creation failed:', {
            code: companyError.code,
            message: companyError.message,
            details: companyError.details,
            hint: companyError.hint
          });
          return new Response(
            JSON.stringify({ 
              error: `Failed to create company: ${companyError.message}`,
              code: companyError.code,
              details: companyError.details 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Company created successfully:', company.id);

        // Log activity
        try {
          await supabaseClient
            .from('activity_logs')
            .insert({
              user_id: user.id,
              action: 'create_company',
              resource_type: 'company',
              resource_id: company.id,
              metadata: { company_name: name }
            });
          console.log('Activity logged successfully');
        } catch (logError) {
          console.error('Failed to log activity (non-critical):', logError);
        }

        console.log('=== COMPANY CREATION COMPLETED SUCCESSFULLY ===');
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

      case 'reset_user_password': {
        console.log('=== STARTING PASSWORD RESET ===');
        const { user_id, new_password } = requestData;
        console.log('Reset password for user:', user_id, 'Manual password:', !!new_password);
        
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          if (new_password) {
            // Manual password reset - admin sets temporary password
            if (new_password.length < 8) {
              return new Response(
                JSON.stringify({ error: 'Password must be at least 8 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            console.log('Setting manual password...');
            const { data: updateData, error: updateError } = await supabaseClient.auth.admin.updateUserById(
              user_id,
              { password: new_password }
            );

            if (updateError) {
              console.error('Failed to update password:', updateError);
              return new Response(
                JSON.stringify({ error: `Failed to reset password: ${updateError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            console.log('Password updated successfully');
          } else {
            // Email-based reset - trigger Supabase password reset email
            console.log('Sending password reset email...');
            
            // Get user email first
            const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
            
            if (userError || !userData.user?.email) {
              console.error('Failed to get user email:', userError);
              return new Response(
                JSON.stringify({ error: 'Failed to retrieve user email' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            // Generate password reset link
            const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
              type: 'recovery',
              email: userData.user.email
            });

            if (resetError) {
              console.error('Failed to generate reset link:', resetError);
              return new Response(
                JSON.stringify({ error: `Failed to send reset email: ${resetError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            console.log('Password reset email sent successfully');
          }

          // Log activity
          try {
            await supabaseClient
              .from('activity_logs')
              .insert({
                user_id: user.id,
                action: 'reset_user_password',
                resource_type: 'user',
                resource_id: user_id,
                metadata: { 
                  reset_method: new_password ? 'manual' : 'email',
                  admin_user_id: user.id
                }
              });
            console.log('Activity logged successfully');
          } catch (logError) {
            console.error('Failed to log activity (non-critical):', logError);
          }

          console.log('=== PASSWORD RESET COMPLETED SUCCESSFULLY ===');
          return new Response(
            JSON.stringify({ 
              success: true, 
              method: new_password ? 'manual' : 'email' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('=== PASSWORD RESET FAILED ===');
          console.error('Error details:', error);
          return new Response(
            JSON.stringify({ error: `Password reset failed: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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