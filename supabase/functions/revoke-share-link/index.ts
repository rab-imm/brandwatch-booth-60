import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevokeShareLinkRequest {
  shareLinkId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { shareLinkId }: RevokeShareLinkRequest = await req.json();

    console.log('Revoking share link:', shareLinkId);

    // Verify user owns the share link
    const { data: shareLink, error: linkError } = await supabase
      .from('letter_share_links')
      .select('id, created_by, revoked_at')
      .eq('id', shareLinkId)
      .eq('created_by', user.id)
      .single();

    if (linkError || !shareLink) {
      console.error('Share link verification error:', linkError);
      return new Response(
        JSON.stringify({ error: 'Share link not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already revoked
    if (shareLink.revoked_at) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Link was already revoked',
          revokedAt: shareLink.revoked_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoke the link
    const { data: updatedLink, error: updateError } = await supabase
      .from('letter_share_links')
      .update({ 
        revoked_at: new Date().toISOString()
      })
      .eq('id', shareLinkId)
      .select()
      .single();

    if (updateError) {
      console.error('Error revoking share link:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to revoke share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Share link revoked successfully');

    return new Response(
      JSON.stringify({
        success: true,
        shareLink: updatedLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in revoke-share-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
