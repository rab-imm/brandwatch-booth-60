import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const healthChecks = []

    // Check Database
    const dbStart = Date.now()
    try {
      await supabaseAdmin.from('profiles').select('count').limit(1)
      healthChecks.push({
        service_name: 'database',
        status: 'healthy',
        response_time_ms: Date.now() - dbStart,
        error_count: 0
      })
    } catch (error) {
      healthChecks.push({
        service_name: 'database',
        status: 'down',
        response_time_ms: Date.now() - dbStart,
        error_count: 1,
        metadata: { error: error.message }
      })
    }

    // Check API
    const apiStart = Date.now()
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/`)
      healthChecks.push({
        service_name: 'api',
        status: response.ok ? 'healthy' : 'degraded',
        response_time_ms: Date.now() - apiStart,
        error_count: response.ok ? 0 : 1
      })
    } catch (error) {
      healthChecks.push({
        service_name: 'api',
        status: 'down',
        response_time_ms: Date.now() - apiStart,
        error_count: 1,
        metadata: { error: error.message }
      })
    }

    // Check Edge Functions
    const edgeFunctionStart = Date.now()
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      })
      healthChecks.push({
        service_name: 'edge_functions',
        status: 'healthy',
        response_time_ms: Date.now() - edgeFunctionStart,
        error_count: 0
      })
    } catch (error) {
      healthChecks.push({
        service_name: 'edge_functions',
        status: 'degraded',
        response_time_ms: Date.now() - edgeFunctionStart,
        error_count: 1,
        metadata: { error: error.message }
      })
    }

    // Store health check results
    for (const check of healthChecks) {
      await supabaseAdmin
        .from('system_health_logs')
        .insert(check)
    }

    const overallStatus = healthChecks.every(c => c.status === 'healthy') ? 'healthy' : 
                         healthChecks.some(c => c.status === 'down') ? 'down' : 'degraded'

    return new Response(
      JSON.stringify({ 
        success: true, 
        overall_status: overallStatus,
        checks: healthChecks 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})