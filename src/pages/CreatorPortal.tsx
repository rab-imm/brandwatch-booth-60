import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { IconBrandStripe, IconCoins, IconTrendingUp, IconTemplate } from "@tabler/icons-react"

export default function CreatorPortal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)

  useEffect(() => {
    fetchCreatorData()
  }, [])

  const fetchCreatorData = async () => {
    try {
      // Fetch creator profile from profiles with metadata
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      setCreator(creatorData)

      // Fetch analytics
      const { data: analyticsData, error } = await supabase.functions.invoke('marketplace-analytics')
      
      if (error) throw error
      setAnalytics(analyticsData?.analytics)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleStripeOnboarding = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding')
      
      if (error) throw error
      
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator Portal</CardTitle>
            <CardDescription>
              Manage your templates and track earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!creator?.payout_enabled && (
              <Button onClick={handleStripeOnboarding} disabled={loading}>
                <IconBrandStripe className="h-4 w-4 mr-2" />
                Connect Stripe for Payouts
              </Button>
            )}
          </CardContent>
        </Card>

        {analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <IconTemplate className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_templates}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_sales}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Creator Earnings</CardTitle>
                <IconCoins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.creator_earnings.toFixed(2)} AED</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <IconCoins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.pending_earnings.toFixed(2)} AED</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}