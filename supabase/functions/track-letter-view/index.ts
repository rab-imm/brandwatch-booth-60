import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackViewRequest {
  token: string;
  password?: string;
  viewDurationSeconds?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, password, viewDurationSeconds }: TrackViewRequest = await req.json();

    console.log('Tracking view for token:', token.substring(0, 8) + '...');

    // Get share link details
    const { data: shareLink, error: linkError } = await supabase
      .from('letter_share_links')
      .select(`
        *,
        legal_letters (
          id,
          title,
          content,
          letter_type,
          status
        )
      `)
      .eq('token', token)
      .single();

    if (linkError || !shareLink) {
      console.error('Share link not found:', linkError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link is revoked
    if (shareLink.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'This link has been revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This link has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max views
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return new Response(
        JSON.stringify({ error: 'Maximum view limit reached' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check password if required
    if (shareLink.is_password_protected && password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const passwordHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (passwordHash !== shareLink.password_hash) {
        return new Response(
          JSON.stringify({ error: 'Incorrect password' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (shareLink.is_password_protected && !password) {
      return new Response(
        JSON.stringify({ 
          requiresPassword: true,
          error: 'Password required' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get visitor info
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log the view
    const { error: logError } = await supabase
      .from('letter_view_logs')
      .insert({
        share_link_id: shareLink.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        view_duration_seconds: viewDurationSeconds,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Error logging view:', logError);
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('letter_share_links')
      .update({ view_count: shareLink.view_count + 1 })
      .eq('id', shareLink.id);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    }

    console.log('View tracked successfully');

    return new Response(
      JSON.stringify({
        success: true,
        letter: shareLink.legal_letters,
        recipientName: shareLink.recipient_name,
        viewCount: shareLink.view_count + 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-letter-view:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
