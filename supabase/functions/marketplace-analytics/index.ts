import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[MARKETPLACE-ANALYTICS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get templates created by this user
    const { data: templates } = await supabaseClient
      .from("templates")
      .select("id, title, price_aed, download_count")
      .eq("created_by", user.id);

    const totalTemplates = templates?.length || 0;
    const totalDownloads = templates?.reduce((sum, t) => sum + (t.download_count || 0), 0) || 0;
    const totalRevenue = templates?.reduce((sum, t) => sum + ((t.price_aed || 0) * (t.download_count || 0)), 0) || 0;

    // Get revenue sharing config
    const { data: config } = await supabaseClient
      .from("system_config")
      .select("config_value")
      .eq("config_key", "revenue_sharing")
      .single();

    const creatorPercentage = (config?.config_value as any)?.creator_percentage || 70;
    const creatorEarnings = (totalRevenue * creatorPercentage) / 100;

    // Get pending earnings from revenue_shares
    const { data: pendingShares } = await supabaseClient
      .from("revenue_shares")
      .select("creator_share_aed")
      .eq("creator_user_id", user.id)
      .eq("status", "pending");

    const pendingEarnings = pendingShares?.reduce((sum, s) => sum + (s.creator_share_aed || 0), 0) || 0;

    // Get recent reviews
    const { data: recentReviews } = await supabaseClient
      .from("template_reviews")
      .select("*, templates(title)")
      .in("template_id", templates?.map(t => t.id) || [])
      .order("created_at", { ascending: false })
      .limit(10);

    logStep("Analytics calculated", { 
      totalTemplates, 
      totalDownloads, 
      totalRevenue, 
      creatorEarnings 
    });

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          total_templates: totalTemplates,
          total_downloads: totalDownloads,
          total_revenue: totalRevenue,
          creator_earnings: creatorEarnings,
          pending_earnings: pendingEarnings,
          creator_percentage: creatorPercentage,
        },
        templates,
        recent_reviews: recentReviews,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});