import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all auth users
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
    console.log(`Found ${authUsers.users.length} auth users`);

    // Get all profiles
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('user_id');

    const profileUserIds = new Set(profiles?.map(p => p.user_id) || []);
    console.log(`Found ${profileUserIds.size} profiles`);

    // Find orphaned auth users (users in auth but not in profiles)
    const orphanedUsers = authUsers.users.filter(user => !profileUserIds.has(user.id));
    console.log(`Found ${orphanedUsers.length} orphaned auth users`);

    const cleanedUsers = [];
    for (const user of orphanedUsers) {
      console.log(`Cleaning up orphaned auth user: ${user.email} (${user.id})`);
      const { error } = await supabaseClient.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`Failed to delete user ${user.email}:`, error);
      } else {
        cleanedUsers.push({ email: user.email, id: user.id });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Cleaned up ${cleanedUsers.length} orphaned auth users`,
      cleanedUsers 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cleanup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});