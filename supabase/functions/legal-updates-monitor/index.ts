import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    console.log('Checking for UAE legislative updates...');

    // Search for recent UAE legal changes
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a UAE legal expert monitoring legislative changes.'
          },
          {
            role: 'user',
            content: `What are the most recent and significant legislative changes, amendments, or new laws in the UAE from the past 7 days? Focus on changes that would affect legal practice, business operations, or individual rights. Provide specific law names, dates, and brief descriptions.`
          }
        ],
        temperature: 0.2,
      }),
    });

    const perplexityData = await perplexityResponse.json();
    const updatesText = perplexityData.choices?.[0]?.message?.content || '';
    const sources = perplexityData.search_results || [];

    console.log('Legislative updates found:', updatesText.substring(0, 200));

    if (!updatesText || updatesText.length < 50) {
      console.log('No significant updates found');
      return new Response(JSON.stringify({ message: 'No updates found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active users with recent activity
    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, email')
      .gte('queries_used', 1);

    if (usersError) throw usersError;

    console.log(`Found ${activeUsers?.length || 0} active users`);

    // Get recent conversations to understand user interests
    const { data: recentConversations } = await supabaseClient
      .from('conversations')
      .select('id, user_id, title')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(1000);

    // Send notifications to active users
    let notificationCount = 0;
    if (activeUsers && activeUsers.length > 0) {
      for (const user of activeUsers) {
        // Create notification for each user
        const { error: notifError } = await supabaseClient.rpc('create_notification', {
          p_user_id: user.user_id,
          p_title: '⚖️ Smart Legal Update',
          p_message: `New legislative changes detected in UAE law. Stay informed about recent legal updates that may affect your queries.`,
          p_type: 'info',
          p_action_url: '/dashboard',
          p_expires_hours: 168 // 7 days
        });

        if (!notifError) {
          notificationCount++;
        }
      }
    }

    // Log the update for admin tracking
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: null,
        action: 'legal_updates_checked',
        resource_type: 'system',
        metadata: {
          updates_found: updatesText.substring(0, 500),
          notifications_sent: notificationCount,
          sources: sources.slice(0, 5).map((s: any) => s.url)
        }
      });

    console.log(`Sent ${notificationCount} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true,
        notifications_sent: notificationCount,
        updates_preview: updatesText.substring(0, 200)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in legal-updates-monitor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
