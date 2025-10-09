import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@/components/ui/Icon"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { format, subDays } from "date-fns"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface AnalyticsData {
  userGrowth: { month: string; users: number; companies: number }[]
  revenueData: { month: string; revenue: number; templates: number }[]
  engagementMetrics: {
    totalQueries: number
    averageQueriesPerUser: number
    topCategories: { category: string; count: number }[]
    documentApprovalRate: number
  }
  systemMetrics: {
    uptime: number
    responseTime: number
    errorRate: number
    activeUsers: number
  }
}

export const AdvancedAnalytics = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [timeRange, setTimeRange] = useState("30d")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [cohortData, setCohortData] = useState<any[]>([])
  const [retentionData, setRetentionData] = useState<any[]>([])
  const [forecastData, setForecastData] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    engagementMetrics: {
      totalQueries: 0,
      averageQueriesPerUser: 0,
      topCategories: [],
      documentApprovalRate: 0
    },
    systemMetrics: {
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1,
      activeUsers: 0
    }
  })

  useEffect(() => {
    if (profile?.user_role === 'super_admin') {
      fetchAnalytics()
      fetchCohortAnalysis()
      fetchRetentionData()
      fetchRevenueForecast()
    }
  }, [profile, timeRange, customDateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Simulate analytics data fetching
      // In a real app, you'd fetch from your analytics service or database
      const mockData: AnalyticsData = {
        userGrowth: [
          { month: 'Jan', users: 120, companies: 8 },
          { month: 'Feb', users: 185, companies: 12 },
          { month: 'Mar', users: 250, companies: 18 },
          { month: 'Apr', users: 320, companies: 25 },
          { month: 'May', users: 410, companies: 32 },
          { month: 'Jun', users: 520, companies: 41 }
        ],
        revenueData: [
          { month: 'Jan', revenue: 2500, templates: 15 },
          { month: 'Feb', revenue: 3200, templates: 22 },
          { month: 'Mar', revenue: 4100, templates: 28 },
          { month: 'Apr', revenue: 5300, templates: 35 },
          { month: 'May', revenue: 6800, templates: 42 },
          { month: 'Jun', revenue: 8500, templates: 51 }
        ],
        engagementMetrics: {
          totalQueries: 15420,
          averageQueriesPerUser: 29.7,
          topCategories: [
            { category: 'Employment', count: 4280 },
            { category: 'Corporate', count: 3650 },
            { category: 'Real Estate', count: 2890 },
            { category: 'Contracts', count: 2340 },
            { category: 'IP', count: 2260 }
          ],
          documentApprovalRate: 87.3
        },
        systemMetrics: {
          uptime: 99.95,
          responseTime: 95,
          errorRate: 0.05,
          activeUsers: 1247
        }
      }

      // Fetch real data from database
      const [usersRes, companiesRes, documentsRes, templatesRes] = await Promise.all([
        supabase.from('profiles').select('created_at').order('created_at'),
        supabase.from('companies').select('created_at').order('created_at'),
        supabase.from('documents').select('status, category, created_at'),
        supabase.from('templates').select('created_at').eq('is_active', true)
      ])

      // Process real data and merge with mock data
      const totalUsers = usersRes.data?.length || 0
      const totalCompanies = companiesRes.data?.length || 0
      const approvedDocs = documentsRes.data?.filter(d => d.status === 'approved').length || 0
      const totalDocs = documentsRes.data?.length || 0
      const approvalRate = totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0

      setAnalytics({
        ...mockData,
        engagementMetrics: {
          ...mockData.engagementMetrics,
          documentApprovalRate: approvalRate
        },
        systemMetrics: {
          ...mockData.systemMetrics,
          activeUsers: totalUsers
        }
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCohortAnalysis = async () => {
    // Mock cohort data - in production would be real SQL cohort analysis
    const cohorts = [
      { cohort: 'Jan 2024', week0: 100, week1: 85, week2: 72, week3: 68, week4: 65 },
      { cohort: 'Feb 2024', week0: 120, week1: 98, week2: 84, week3: 78, week4: 72 },
      { cohort: 'Mar 2024', week0: 150, week1: 125, week2: 110, week3: 102, week4: 95 },
      { cohort: 'Apr 2024', week0: 180, week1: 155, week2: 138, week3: 128, week4: 118 },
    ]
    setCohortData(cohorts)
  }

  const fetchRetentionData = async () => {
    // Mock retention curve
    const retention = [
      { day: 'Day 1', rate: 100 },
      { day: 'Day 7', rate: 72 },
      { day: 'Day 14', rate: 58 },
      { day: 'Day 30', rate: 45 },
      { day: 'Day 60', rate: 38 },
      { day: 'Day 90', rate: 35 },
    ]
    setRetentionData(retention)
  }

  const fetchRevenueForecast = async () => {
    // Mock revenue forecast with trend line
    const forecast = [
      { month: 'Jul', actual: 8500, forecast: 8600 },
      { month: 'Aug', actual: 9200, forecast: 9400 },
      { month: 'Sep', actual: null, forecast: 10500 },
      { month: 'Oct', actual: null, forecast: 11800 },
      { month: 'Nov', actual: null, forecast: 13200 },
      { month: 'Dec', actual: null, forecast: 15000 },
    ]
    setForecastData(forecast)
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true)
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Analytics exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }

  if (profile?.user_role !== 'super_admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You don't have permission to view analytics.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {timeRange === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Icon name="calendar" className="h-4 w-4 mr-2" />
                  {customDateRange?.from && customDateRange?.to 
                    ? `${format(customDateRange.from, 'MMM dd')} - ${format(customDateRange.to, 'MMM dd')}`
                    : 'Select dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => setCustomDateRange(range as { from: Date; to: Date } | undefined)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Icon name="download" className="h-4 w-4 mr-2" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleExport('csv')}>
                  Export as CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleExport('pdf')}>
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Icon name="dollar-sign" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {analytics.revenueData[analytics.revenueData.length - 1]?.revenue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Icon name="users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemMetrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Icon name="zap" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemMetrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              -15ms from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Icon name="activity" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.systemMetrics.uptime}%</div>
            <Progress value={analytics.systemMetrics.uptime} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user and company registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.userGrowth.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                  <div className="font-medium">{data.month}</div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{data.users}</div>
                      <div className="text-xs text-muted-foreground">Users</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{data.companies}</div>
                      <div className="text-xs text-muted-foreground">Companies</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue and template sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.revenueData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                  <div className="font-medium">{data.month}</div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">AED {data.revenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{data.templates}</div>
                      <div className="text-xs text-muted-foreground">Templates</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Credit usage and user activity metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.engagementMetrics.totalQueries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Queries</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.engagementMetrics.averageQueriesPerUser}
                </div>
                <div className="text-sm text-muted-foreground">Avg per User</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Document Approval Rate</h4>
              <div className="flex items-center gap-3">
                <Progress value={analytics.engagementMetrics.documentApprovalRate} className="flex-1" />
                <span className="font-semibold text-green-600">
                  {analytics.engagementMetrics.documentApprovalRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most popular legal document categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.engagementMetrics.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      index === 2 ? 'bg-yellow-600' :
                      index === 3 ? 'bg-purple-600' : 'bg-gray-600'
                    }`} />
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{category.count.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {((category.count / analytics.engagementMetrics.totalQueries) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Analysis</CardTitle>
          <CardDescription>User retention by registration cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="week0" stroke="#3b82f6" name="Week 0" />
              <Line type="monotone" dataKey="week1" stroke="#10b981" name="Week 1" />
              <Line type="monotone" dataKey="week2" stroke="#f59e0b" name="Week 2" />
              <Line type="monotone" dataKey="week3" stroke="#ef4444" name="Week 3" />
              <Line type="monotone" dataKey="week4" stroke="#8b5cf6" name="Week 4" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Retention Curve */}
      <Card>
        <CardHeader>
          <CardTitle>User Retention Curve</CardTitle>
          <CardDescription>Percentage of users retained over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecasting</CardTitle>
          <CardDescription>Actual vs. predicted revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual Revenue" />
              <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health & Performance</CardTitle>
          <CardDescription>Real-time system monitoring and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Icon name="server" className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-lg font-semibold text-green-600">{analytics.systemMetrics.uptime}%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Icon name="zap" className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-lg font-semibold text-blue-600">{analytics.systemMetrics.responseTime}ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Icon name="alert-triangle" className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-lg font-semibold text-yellow-600">{analytics.systemMetrics.errorRate}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Icon name="users" className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-lg font-semibold text-purple-600">{analytics.systemMetrics.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}