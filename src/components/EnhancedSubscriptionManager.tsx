import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { IconLoader2, IconCreditCard, IconPlayerPause, IconTrendingUp, IconBolt } from "@tabler/icons-react"

export const EnhancedSubscriptionManager = () => {
  const { profile, refetchProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [tiers, setTiers] = useState<any[]>([])

  const fetchTiers = async () => {
    const { data } = await supabase
      .from('subscription_tiers' as any)
      .select('*')
      .eq('is_active', true)
      .order('monthly_price_aed')
    
    setTiers(data || [])
  }

  useState(() => {
    fetchTiers()
  })

  const handleUpgrade = async (tierId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'upgrade',
          tier_id: tierId,
          billing_cycle: annualBilling ? 'annual' : 'monthly'
        }
      })

      if (error) throw error

      toast({
        title: "Subscription Updated",
        description: "Your subscription has been upgraded successfully.",
      })

      await refetchProfile()
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

  const handlePause = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'pause',
          pause_reason: 'User requested pause'
        }
      })

      if (error) throw error

      toast({
        title: "Subscription Paused",
        description: "Your subscription will resume automatically in 30 days.",
      })
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            You are currently on the <Badge variant="outline">{profile?.subscription_tier || 'free'}</Badge> plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="annual-billing">Annual Billing</Label>
              <Badge variant="secondary">Save 20%</Badge>
            </div>
            <Switch
              id="annual-billing"
              checked={annualBilling}
              onCheckedChange={setAnnualBilling}
            />
          </div>

          <Button
            variant="outline"
            onClick={handlePause}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <IconPlayerPause className="h-4 w-4 mr-2" />
                Pause Subscription
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => {
          const price = annualBilling ? tier.annual_price_aed : tier.monthly_price_aed
          const isCurrentTier = profile?.subscription_tier === tier.tier_name

          return (
            <Card key={tier.id} className={isCurrentTier ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.tier_name}
                  {isCurrentTier && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">{price} AED</span>
                  <span className="text-muted-foreground">
                    /{annualBilling ? 'year' : 'month'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconBolt className="h-4 w-4 text-primary" />
                    <span>{tier.credits_per_month} credits/month</span>
                  </div>
                  {tier.max_team_members && (
                    <div className="flex items-center gap-2">
                      <IconTrendingUp className="h-4 w-4 text-primary" />
                      <span>Up to {tier.max_team_members} team members</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={loading || isCurrentTier}
                  className="w-full"
                  variant={isCurrentTier ? "outline" : "default"}
                >
                  {loading ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentTier ? (
                    "Current Plan"
                  ) : (
                    "Upgrade"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}