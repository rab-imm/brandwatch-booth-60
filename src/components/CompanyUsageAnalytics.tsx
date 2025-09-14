import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { toast } from "sonner"

interface UsageData {
  date: string
  credits_used: number
  user_name: string
  user_id: string
}

interface CompanyUsageAnalyticsProps {
  company: any
  companyUsers: any[]
}

export const CompanyUsageAnalytics = ({ company, companyUsers }: CompanyUsageAnalyticsProps) => {
  const { user } = useAuth()
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [company?.id])

  const fetchUsageData = async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      
      // Get last 30 days of activity logs for credit usage
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: activityData, error } = await supabase
        .from('activity_logs')
        .select(`
          created_at,
          user_id,
          metadata
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('action', 'query_executed')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Process data for charts - use company users data for names
      const processedData = activityData?.map(log => {
        const user = companyUsers.find(u => u.user_id === log.user_id)
        return {
          date: new Date(log.created_at).toLocaleDateString(),
          credits_used: 1, // Each query = 1 credit
          user_name: user?.profile?.full_name || user?.profile?.email || 'Unknown User',
          user_id: log.user_id
        }
      }) || []

      setUsageData(processedData)
    } catch (error) {
      console.error('Error fetching usage data:', error)
      toast.error('Failed to load usage analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,User,Credits Used\n" +
      usageData.map(row => `${row.date},${row.user_name},${row.credits_used}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `company-usage-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Usage data exported successfully')
  }

  // Aggregate data by date for line chart
  const dailyUsage = usageData.reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date)
    if (existing) {
      existing.credits_used += curr.credits_used
    } else {
      acc.push({ date: curr.date, credits_used: curr.credits_used })
    }
    return acc
  }, [] as { date: string; credits_used: number }[])

  // Aggregate data by user for bar chart
  const userUsage = companyUsers.map(user => ({
    name: user.profile?.full_name || user.profile?.email || 'Unknown',
    credits_used: user.used_credits,
    max_credits: user.max_credits_per_period
  }))

  const creditUsagePercentage = (company.used_credits / company.total_credits) * 100
  const isNearLimit = creditUsagePercentage >= 80

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Usage Alerts */}
      {isNearLimit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Icon name="alert-triangle" className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">High Usage Alert</p>
                <p className="text-sm text-amber-700">
                  Your company has used {company.used_credits} out of {company.total_credits} credits ({creditUsagePercentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Usage Analytics</h3>
        <Button onClick={exportData} variant="outline" size="sm">
          <Icon name="download" className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Daily Usage Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Credit Usage</CardTitle>
          <CardDescription>Credit consumption over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="credits_used" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Credits Used"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Usage</CardTitle>
          <CardDescription>Credit usage by individual team members</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="credits_used" fill="hsl(var(--primary))" name="Credits Used" />
              <Bar dataKey="max_credits" fill="hsl(var(--muted))" name="Credit Limit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Usage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
          </CardHeader>
          <CardContent>
            {userUsage.length > 0 ? (
              <>
                <div className="text-lg font-bold">
                  {userUsage.reduce((prev, current) => (prev.credits_used > current.credits_used) ? prev : current).name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userUsage.reduce((prev, current) => (prev.credits_used > current.credits_used) ? prev : current).credits_used} credits used
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {dailyUsage.length > 0 ? 
                Math.round(dailyUsage.reduce((sum, day) => sum + day.credits_used, 0) / dailyUsage.length) : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">credits per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Until Reset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {Math.ceil((new Date(company.credits_reset_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-xs text-muted-foreground">days remaining</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}