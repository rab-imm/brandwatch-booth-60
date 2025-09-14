import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/Icon"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { Header } from "@/components/Header"

interface PersonalActivity {
  id: string
  action: string
  resource_type: string
  created_at: string
  metadata: any
}

interface UsageStats {
  total_queries: number
  queries_this_week: number
  queries_last_week: number
  templates_downloaded: number
  conversations_started: number
}

export const PersonalDashboard = () => {
  const { user, profile } = useAuth()
  const [activities, setActivities] = useState<PersonalActivity[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [usageTrend, setUsageTrend] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchPersonalData()
    }
  }, [user])

  const fetchPersonalData = async () => {
    try {
      setLoading(true)
      
      // Fetch recent activities
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activityError) throw activityError
      setActivities(activityData || [])

      // Calculate usage statistics
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      // Get query counts - fixed count syntax
      const { count: totalQueries } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('action', 'query_executed')

      const { count: thisWeekQueries } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('action', 'query_executed')
        .gte('created_at', oneWeekAgo.toISOString())

      const { count: lastWeekQueries } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('action', 'query_executed')
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', oneWeekAgo.toISOString())

      // Get template downloads
      const { count: templateDownloads } = await supabase
        .from('template_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)

      // Get conversations
      const { count: conversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)

      setUsageStats({
        total_queries: totalQueries || 0,
        queries_this_week: thisWeekQueries || 0,
        queries_last_week: lastWeekQueries || 0,
        templates_downloaded: templateDownloads || 0,
        conversations_started: conversations || 0
      })

      // Generate usage trend for last 7 days
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const { count: dayQueries } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('action', 'query_executed')
          .gte('created_at', dateStr + 'T00:00:00.000Z')
          .lt('created_at', dateStr + 'T23:59:59.999Z')

        trendData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          queries: dayQueries || 0
        })
      }
      
      setUsageTrend(trendData)

    } catch (error) {
      console.error('Error fetching personal data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'query_executed': return 'message-square'
      case 'template_download': return 'download'
      case 'conversation_created': return 'plus'
      default: return 'activity'
    }
  }

  const formatActivityDescription = (activity: PersonalActivity) => {
    switch (activity.action) {
      case 'query_executed':
        return 'Executed a legal query'
      case 'template_download':
        return 'Downloaded a template'
      case 'conversation_created':
        return 'Started a new conversation'
      default:
        return activity.action.replace('_', ' ')
    }
  }

  const creditUsagePercentage = profile ? (profile.queries_used / (profile.max_credits_per_period || 10)) * 100 : 0
  const isNearLimit = creditUsagePercentage >= 80

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          {/* Skeleton Stats Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-2 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Skeleton Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Personal Dashboard</h1>
          <p className="text-muted-foreground">Track your usage and activity</p>
        </div>

        {/* Usage Alert */}
        {isNearLimit && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Icon name="alert-triangle" className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">High Usage Alert</p>
                  <p className="text-sm text-amber-700">
                    You've used {profile?.queries_used || 0} out of {profile?.max_credits_per_period || 10} queries ({creditUsagePercentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Mobile Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Credits</CardTitle>
              <Icon name="zap" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.queries_used || 0} / {profile?.max_credits_per_period || 10}
              </div>
              <Progress value={creditUsagePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.max(0, (profile?.max_credits_per_period || 10) - (profile?.queries_used || 0))} remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Icon name="trending-up" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats?.queries_this_week || 0}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats && usageStats.queries_this_week > usageStats.queries_last_week ? (
                  <span className="text-green-600">
                    +{usageStats.queries_this_week - usageStats.queries_last_week} from last week
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {usageStats?.queries_last_week || 0} last week
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Icon name="file-text" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats?.templates_downloaded || 0}</div>
              <p className="text-xs text-muted-foreground">Downloaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <Icon name="message-circle" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats?.conversations_started || 0}</div>
              <p className="text-xs text-muted-foreground">Started</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Usage Trend - Mobile Optimized */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Trend</CardTitle>
              <CardDescription>Your query usage over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="queries" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Queries"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <Icon 
                        name={getActivityIcon(activity.action)} 
                        className="h-4 w-4 text-muted-foreground" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatActivityDescription(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Icon name="activity" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">No recent activity</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Start using the platform to see your activity here
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
                      <Icon name="message-square" className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'} className="flex-1 sm:flex-none">
                <Icon name="message-square" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Start New Chat</span>
                <span className="sm:hidden">Chat</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/subscription'} className="flex-1 sm:flex-none">
                <Icon name="credit-card" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Manage Subscription</span>
                <span className="sm:hidden">Billing</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/templates'} className="flex-1 sm:flex-none">
                <Icon name="file-text" className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Browse Templates</span>
                <span className="sm:hidden">Templates</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}