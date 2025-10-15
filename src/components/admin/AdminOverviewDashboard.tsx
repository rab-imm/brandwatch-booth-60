import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/Icon"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface DashboardStats {
  totalUsers: number
  totalCompanies: number
  totalDocuments: number
  pendingDocuments: number
  totalTemplates: number
  totalRevenue: number
  activeSubscriptions: number
  todayActivity: number
}

export const AdminOverviewDashboard = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    totalTemplates: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    todayActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const hasAdminAccess = profile?.roles?.some(role => 
    ['super_admin', 'company_admin'].includes(role)
  ) || false

  useEffect(() => {
    if (hasAdminAccess) {
      fetchDashboardStats()
      fetchRecentActivity()
    }
  }, [profile, hasAdminAccess])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // Fetch all stats in parallel
      const [
        usersRes,
        companiesRes,
        documentsRes,
        pendingDocsRes,
        templatesRes,
        revenueRes,
        subscriptionsRes,
        activityRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('revenue_shares').select('creator_share_aed').eq('status', 'paid'),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      const totalRevenue = revenueRes.data?.reduce((sum, item) => sum + (Number(item.creator_share_aed) || 0), 0) || 0

      setStats({
        totalUsers: usersRes.count || 0,
        totalCompanies: companiesRes.count || 0,
        totalDocuments: documentsRes.count || 0,
        pendingDocuments: pendingDocsRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        totalRevenue,
        activeSubscriptions: subscriptionsRes.count || 0,
        todayActivity: activityRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentActivity(data || [])
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'document_upload': return 'upload'
      case 'document_approved': return 'check-circle'
      case 'template_created': return 'file-plus'
      case 'user_registered': return 'user-plus'
      case 'subscription_created': return 'credit-card'
      default: return 'activity'
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'document_upload': return 'text-blue-600'
      case 'document_approved': return 'text-green-600'
      case 'template_created': return 'text-purple-600'
      case 'user_registered': return 'text-indigo-600'
      case 'subscription_created': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const documentApprovalRate = stats.totalDocuments > 0 
    ? ((stats.totalDocuments - stats.pendingDocuments) / stats.totalDocuments) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Icon name="users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Registered platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Icon name="building" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubscriptions} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <Icon name="file-text" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDocuments} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Icon name="dollar-sign" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total creator revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Icon name="file-plus" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Active templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <Icon name="activity" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActivity}</div>
            <p className="text-xs text-muted-foreground">
              Actions in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <Icon name="trending-up" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentApprovalRate.toFixed(1)}%</div>
            <Progress value={documentApprovalRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Icon name="shield-check" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions and events across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="inbox" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full bg-background ${getActivityColor(activity.action)}`}>
                    <Icon name={getActivityIcon(activity.action)} className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {activity.action.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.resource_type} • {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.resource_type}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}