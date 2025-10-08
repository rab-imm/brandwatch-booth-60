import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[SYSTEM-HEALTH] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  try {
    logStep("Health check started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const healthChecks = [];

    // Check Database
    const dbStart = Date.now();
    try {
      const { error } = await supabaseAdmin.from("profiles").select("user_id").limit(1);
      const responseTime = Date.now() - dbStart;
      
      healthChecks.push({
        service_name: "database",
        status: error ? "degraded" : "healthy",
        response_time_ms: responseTime,
        error_rate: error ? 1 : 0,
      });
      
      logStep("Database check", { status: error ? "degraded" : "healthy", responseTime });
    } catch (error) {
      healthChecks.push({
        service_name: "database",
        status: "down",
        response_time_ms: Date.now() - dbStart,
        error_rate: 1,
      });
      logStep("Database check failed", { error: error instanceof Error ? error.message : String(error) });
    }

    // Check API
    const apiStart = Date.now();
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/`, {
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
      });
      const responseTime = Date.now() - apiStart;
      
      healthChecks.push({
        service_name: "api",
        status: response.ok ? "healthy" : "degraded",
        response_time_ms: responseTime,
        error_rate: response.ok ? 0 : 0.5,
      });
      
      logStep("API check", { status: response.ok ? "healthy" : "degraded", responseTime });
    } catch (error) {
      healthChecks.push({
        service_name: "api",
        status: "down",
        response_time_ms: Date.now() - apiStart,
        error_rate: 1,
      });
      logStep("API check failed", { error: error instanceof Error ? error.message : String(error) });
    }

    // Check Auth Service
    const authStart = Date.now();
    try {
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/health`, {
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
      });
      const responseTime = Date.now() - authStart;
      
      healthChecks.push({
        service_name: "auth",
        status: response.ok ? "healthy" : "degraded",
        response_time_ms: responseTime,
        error_rate: response.ok ? 0 : 0.5,
      });
      
      logStep("Auth check", { status: response.ok ? "healthy" : "degraded", responseTime });
    } catch (error) {
      healthChecks.push({
        service_name: "auth",
        status: "degraded",
        response_time_ms: Date.now() - authStart,
        error_rate: 0.5,
      });
      logStep("Auth check warning", { error: error instanceof Error ? error.message : String(error) });
    }

    // Store health check results
    for (const check of healthChecks) {
      await supabaseAdmin.from("system_health_logs").insert(check);
    }

    const overallStatus = healthChecks.every((c) => c.status === "healthy")
      ? "healthy"
      : healthChecks.some((c) => c.status === "down")
      ? "down"
      : "degraded";

    logStep("Health check completed", { overallStatus, checks: healthChecks.length });

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        checks: healthChecks,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});