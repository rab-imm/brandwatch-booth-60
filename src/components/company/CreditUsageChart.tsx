import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface CreditUsageData {
  name: string
  credits: number
  maxCredits: number
}

interface CreditUsageChartProps {
  companyId: string
}

export const CreditUsageChart = ({ companyId }: CreditUsageChartProps) => {
  const [data, setData] = useState<CreditUsageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditUsage()
  }, [companyId])

  const fetchCreditUsage = async () => {
    try {
      setLoading(true)
      const { data: users, error } = await supabase
        .from('user_company_roles')
        .select(`
          used_credits,
          max_credits_per_period,
          user_id
        `)
        .eq('company_id', companyId)

      if (error) throw error

      // Fetch profile data separately
      const userIds = users?.map(u => u.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

      const chartData = users?.map(user => {
        const profile = profileMap.get(user.user_id)
        return {
          name: profile?.full_name || profile?.email || 'Unknown',
          credits: user.used_credits,
          maxCredits: user.max_credits_per_period || 0
        }
      }) || []

      setData(chartData)
    } catch (error) {
      console.error('Error fetching credit usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBarColor = (credits: number, maxCredits: number) => {
    if (maxCredits === 0) return '#6b7280' // gray if no limit set
    const percentage = (credits / maxCredits) * 100
    if (percentage >= 90) return '#ef4444' // red
    if (percentage >= 70) return '#f59e0b' // orange
    return '#10b981' // green
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage by Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="bar-chart" className="h-5 w-5" />
          Credit Usage by Team Member
        </CardTitle>
        <CardDescription>
          See how credits are being used across your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const percentage = data.maxCredits > 0 
                      ? ((data.credits / data.maxCredits) * 100).toFixed(1)
                      : 'N/A'
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.credits} / {data.maxCredits} credits used
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {percentage !== 'N/A' ? `${percentage}% utilized` : 'No limit set'}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="credits" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.credits, entry.maxCredits)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
