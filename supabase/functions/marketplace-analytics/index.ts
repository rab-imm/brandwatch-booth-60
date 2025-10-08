import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get creator profile
    const { data: creator } = await supabaseClient
      .from('template_creators')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!creator) throw new Error('Creator profile not found')

    // Get templates created by this user
    const { data: templates } = await supabaseClient
      .from('templates')
      .select('id, title, price, downloads_count')
      .eq('created_by', user.id)

    // Calculate analytics
    const totalSales = templates?.reduce((sum, t) => sum + (t.downloads_count || 0), 0) || 0
    const totalRevenue = templates?.reduce((sum, t) => sum + ((t.price || 0) * (t.downloads_count || 0)), 0) || 0

    // Get revenue sharing config
    const { data: config } = await supabaseClient
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'revenue_sharing')
      .single()

    const creatorPercentage = (config?.config_value as any)?.creator_percentage || 70
    const creatorEarnings = (totalRevenue * creatorPercentage) / 100

    // Get recent reviews
    const { data: recentReviews } = await supabaseClient
      .from('template_reviews')
      .select('*, templates(title)')
      .in('template_id', templates?.map(t => t.id) || [])
      .order('created_at', { ascending: false })
      .limit(10)

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          total_templates: templates?.length || 0,
          total_sales: totalSales,
          total_revenue: totalRevenue,
          creator_earnings: creatorEarnings,
          average_rating: creator.rating_average,
          pending_earnings: creator.pending_earnings_aed
        },
        templates,
        recent_reviews: recentReviews
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})