import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[USAGE-ALERTS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("queries_used, queries_limit")
      .eq("user_id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found");

    const usagePercentage = (profile.queries_used / profile.queries_limit) * 100;
    logStep("Usage calculated", { 
      used: profile.queries_used, 
      limit: profile.queries_limit, 
      percentage: usagePercentage 
    });

    const alerts = [];

    if (usagePercentage >= 90) {
      const { error: alertError } = await supabaseClient.from("notifications").insert({
        user_id: user.id,
        title: "Credit Limit Warning",
        message: `You've used ${usagePercentage.toFixed(0)}% of your monthly credits. Consider upgrading your plan.`,
        type: "warning",
        action_url: "/pricing",
      });

      if (!alertError) {
        alerts.push({ threshold: 90, triggered: true });
        logStep("Created 90% alert");
      }
    } else if (usagePercentage >= 75) {
      const { error: alertError } = await supabaseClient.from("notifications").insert({
        user_id: user.id,
        title: "Credit Usage Notice",
        message: `You've used ${usagePercentage.toFixed(0)}% of your monthly credits.`,
        type: "info",
        action_url: "/dashboard",
      });

      if (!alertError) {
        alerts.push({ threshold: 75, triggered: true });
        logStep("Created 75% alert");
      }
    }

    return new Response(
      JSON.stringify({
        usage_percentage: usagePercentage,
        alerts_created: alerts.length,
        alerts,
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