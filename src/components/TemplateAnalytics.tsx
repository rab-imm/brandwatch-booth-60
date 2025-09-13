import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

interface TemplateAnalytics {
  template_id: string
  template_title: string
  total_views: number
  total_downloads: number
  total_purchases: number
  revenue_earned: number
  download_count: number
}

interface RevenueShare {
  id: string
  sale_amount_aed: number
  creator_share_aed: number
  platform_share_aed: number
  created_at: string
  status: string
}

export const TemplateAnalytics = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([])
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
      fetchRevenueShares()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          id,
          title,
          download_count,
          template_analytics (
            action_type,
            created_at
          )
        `)
        .eq('created_by', user?.id)
        .eq('is_active', true)

      if (error) throw error

      const analyticsData = data?.map(template => {
        const views = template.template_analytics?.filter(a => a.action_type === 'view').length || 0
        const downloads = template.template_analytics?.filter(a => a.action_type === 'download').length || 0
        const purchases = template.template_analytics?.filter(a => a.action_type === 'purchase').length || 0

        return {
          template_id: template.id,
          template_title: template.title,
          total_views: views,
          total_downloads: downloads,
          total_purchases: purchases,
          revenue_earned: 0, // Will be calculated from revenue_shares
          download_count: template.download_count
        }
      }) || []

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch template analytics",
        variant: "destructive"
      })
    }
  }

  const fetchRevenueShares = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_shares')
        .select('*')
        .eq('creator_user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRevenueShares(data || [])
    } catch (error) {
      console.error('Error fetching revenue shares:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = revenueShares.reduce((sum, share) => sum + Number(share.creator_share_aed), 0)
  const pendingRevenue = revenueShares
    .filter(share => share.status === 'pending')
    .reduce((sum, share) => sum + Number(share.creator_share_aed), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {totalRevenue.toFixed(2)}</div>
            <Badge variant="secondary" className="mt-1">
              <Icon name="trending-up" className="h-3 w-3 mr-1" />
              Earned
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {pendingRevenue.toFixed(2)}</div>
            <Badge variant="outline" className="mt-1">
              <Icon name="clock" className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
            <Badge variant="outline" className="mt-1">
              <Icon name="file-text" className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="bar-chart" className="h-5 w-5" />
            Template Performance
          </CardTitle>
          <CardDescription>
            View and download analytics for your templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="file-text" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.map((template) => (
                <div key={template.template_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{template.template_title}</h3>
                    <Badge variant="outline">
                      {template.download_count} downloads
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{template.total_views}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{template.total_downloads}</div>
                      <div className="text-muted-foreground">Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{template.total_purchases}</div>
                      <div className="text-muted-foreground">Purchases</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="credit-card" className="h-5 w-5" />
            Recent Revenue
          </CardTitle>
          <CardDescription>
            Latest revenue shares from template sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueShares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="credit-card" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No revenue generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueShares.slice(0, 10).map((share) => (
                <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">AED {Number(share.creator_share_aed).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(share.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={share.status === 'paid' ? 'default' : 'secondary'}>
                    {share.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}