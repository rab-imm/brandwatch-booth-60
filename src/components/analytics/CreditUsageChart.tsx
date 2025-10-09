import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Icon } from "@/components/ui/Icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface CreditUsageData {
  date: string
  credits_used: number
  transaction_type: string
}

export const CreditUsageChart = () => {
  const { session } = useAuth()
  const [usageData, setUsageData] = useState<CreditUsageData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7")
  const [totalCreditsUsed, setTotalCreditsUsed] = useState(0)

  useEffect(() => {
    if (session) {
      fetchUsageData()
    }
  }, [session, timeRange])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      const daysAgo = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('amount, transaction_type, created_at')
        .eq('user_id', session?.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const grouped = (data || []).reduce((acc: any, transaction: any) => {
        const date = new Date(transaction.created_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = { date, credits_used: 0, transactions: {} }
        }
        acc[date].credits_used += Math.abs(transaction.amount)
        acc[date].transactions[transaction.transaction_type] = 
          (acc[date].transactions[transaction.transaction_type] || 0) + Math.abs(transaction.amount)
        return acc
      }, {})

      const chartData = Object.values(grouped)
      setUsageData(chartData as CreditUsageData[])
      
      const total = chartData.reduce((sum: number, day: any) => sum + (day.credits_used || 0), 0)
      setTotalCreditsUsed(total as number)
    } catch (error) {
      console.error('Error fetching usage data:', error)
      toast.error("Failed to load credit usage data")
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="trending-up" className="h-5 w-5" />
              Credit Usage Analytics
            </CardTitle>
            <CardDescription>Track your credit consumption over time</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Credits Used</div>
            <div className="text-2xl font-bold text-primary">{totalCreditsUsed}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Daily Average</div>
            <div className="text-2xl font-bold">
              {usageData.length > 0 ? Math.round(totalCreditsUsed / usageData.length) : 0}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Peak Day</div>
            <div className="text-2xl font-bold">
              {usageData.length > 0 
                ? Math.max(...usageData.map(d => d.credits_used))
                : 0}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={usageData}>
            <defs>
              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="credits_used" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorCredits)" 
              name="Credits Used"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
