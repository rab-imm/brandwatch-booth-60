import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { Icon } from "@/components/ui/Icon"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { toast } from "sonner"

interface RevenueData {
  tier: string
  users: number
  mrr: number
  color: string
}

export const SubscriptionRevenueAnalytics = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMRR, setTotalMRR] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)

      // Get tier pricing
      const tierPricing: Record<string, number> = {
        free: 0,
        essential: 49,
        premium: 149,
        essential_business: 499,
        premium_business: 999,
        enterprise: 2999
      }

      const colors: Record<string, string> = {
        free: '#94a3b8',
        essential: '#60a5fa',
        premium: '#8b5cf6',
        essential_business: '#f59e0b',
        premium_business: '#ec4899',
        enterprise: '#10b981'
      }

      // Get user counts per tier
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('subscription_tier')

      if (error) throw error

      const tierCounts = (profiles || []).reduce((acc: any, profile: any) => {
        const tier = profile.subscription_tier || 'free'
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      }, {})

      const data: RevenueData[] = Object.entries(tierCounts).map(([tier, count]) => ({
        tier: tier.replace(/_/g, ' ').toUpperCase(),
        users: count as number,
        mrr: (count as number) * tierPricing[tier],
        color: colors[tier] || '#94a3b8'
      }))

      setRevenueData(data)
      setTotalMRR(data.reduce((sum, d) => sum + d.mrr, 0))
      setTotalUsers(data.reduce((sum, d) => sum + d.users, 0))
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      toast.error("Failed to load revenue analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Icon name="loader" className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              AED {totalMRR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected monthly revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all tiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Revenue Per User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              AED {totalUsers > 0 ? Math.round(totalMRR / totalUsers) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Monthly recurring revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="tier" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="mrr" name="MRR (AED)">
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users per subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, users }) => `${tier}: ${users}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
