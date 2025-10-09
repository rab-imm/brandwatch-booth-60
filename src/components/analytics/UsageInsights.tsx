import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Icon } from "@/components/ui/Icon"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface UsageStats {
  totalLettersGenerated: number
  totalTemplatesDownloaded: number
  creditsUsedThisMonth: number
  creditLimit: number
  mostUsedFeature: string
  accountAge: number
}

export const UsageInsights = () => {
  const { session } = useAuth()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchUsageStats()
    }
  }, [session])

  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      
      // Get user profile for credit info
      const { data: profile } = await supabase
        .from('profiles')
        .select('queries_used, subscription_tier, created_at')
        .eq('user_id', session?.user.id)
        .single()

      // Calculate credit limit based on tier
      const getCreditLimit = (tier: string) => {
        const limits: Record<string, number> = {
          free: 10,
          essential: 100,
          premium: 500,
          essential_business: 1500,
          premium_business: 2500,
          enterprise: 10000
        }
        return limits[tier] || 10
      }

      // Get letter count
      const { count: letterCount } = await supabase
        .from('legal_letters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id)

      // Get template download count
      const { count: templateCount } = await supabase
        .from('template_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user.id)

      // Get most used transaction type
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('transaction_type')
        .eq('user_id', session?.user.id)

      const transactionTypes = transactions?.reduce((acc: any, t: any) => {
        acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1
        return acc
      }, {})

      const mostUsedFeature = transactionTypes 
        ? Object.entries(transactionTypes).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None'
        : 'None'

      const accountAge = profile?.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setStats({
        totalLettersGenerated: letterCount || 0,
        totalTemplatesDownloaded: templateCount || 0,
        creditsUsedThisMonth: profile?.queries_used || 0,
        creditLimit: getCreditLimit(profile?.subscription_tier || 'free'),
        mostUsedFeature: mostUsedFeature.replace(/_/g, ' '),
        accountAge
      })
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      toast.error("Failed to load usage insights")
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Icon name="loader" className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const creditUsagePercentage = (stats.creditsUsedThisMonth / stats.creditLimit) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="bar-chart" className="h-5 w-5" />
          Usage Insights
        </CardTitle>
        <CardDescription>Your platform usage summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Credit Usage This Month</span>
            <span className="text-sm text-muted-foreground">
              {stats.creditsUsedThisMonth} / {stats.creditLimit}
            </span>
          </div>
          <Progress value={creditUsagePercentage} className="h-2" />
          {creditUsagePercentage > 80 && (
            <Badge variant="destructive" className="text-xs">
              <Icon name="alert-triangle" className="h-3 w-3 mr-1" />
              High usage - consider upgrading
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="file-text" className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Letters Generated</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalLettersGenerated}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="download" className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Templates Downloaded</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTemplatesDownloaded}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="trending-up" className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Most Used Feature</span>
            </div>
            <div className="text-lg font-medium capitalize">{stats.mostUsedFeature}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Account Age</span>
            </div>
            <div className="text-lg font-medium">{stats.accountAge} days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
