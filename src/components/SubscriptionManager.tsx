import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalBillingHistory } from "@/components/PersonalBillingHistory"
import { Header } from "@/components/Header"
import { Database } from "@/integrations/supabase/types"

type SubscriptionTier = Database['public']['Tables']['subscription_tiers']['Row']

const CREDIT_PACKAGES = [
  { credits: 50, price: 25, label: "50 Credits" },
  { credits: 100, price: 45, label: "100 Credits" },
  { credits: 200, price: 80, label: "200 Credits" },
  { credits: 500, price: 180, label: "500 Credits" },
]

export const SubscriptionManager = () => {
  const { user, profile, refetchProfile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("subscription")
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loadingCredit, setLoadingCredit] = useState(false)

  useEffect(() => {
    fetchTiers()
    if (user) {
      checkSubscriptionStatus()
    }
  }, [user])

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")

    if (!error && data) {
      setTiers(data)
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      if (error) throw error
      
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const priceId = tier.stripe_price_id_monthly

      if (!priceId) {
        throw new Error("Price ID not configured")
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      })

      if (error) throw error

      if (data.url) {
        window.open(data.url, '_blank')
        toast({
          title: "Redirecting to Checkout",
          description: "Opening Stripe checkout in a new tab...",
        })
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({
        title: "Subscription Failed",
        description: "There was an error processing your subscription. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseCredits = async (credits: number, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits",
        variant: "destructive"
      })
      return
    }

    setLoadingCredit(true)

    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { 
          credits,
          price_aed: price 
        }
      })

      if (error) throw error

      if (data?.url) {
        window.open(data.url, '_blank')
        toast({
          title: "Redirecting to Payment",
          description: "Opening payment page in a new tab...",
        })
      }
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast({
        title: "Purchase Failed",
        description: "Unable to process credit purchase. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingCredit(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal')

      if (error) throw error

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({
        title: "Portal Error",
        description: "Unable to open subscription management portal",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentTierData = () => {
    if (!profile?.subscription_tier) {
      return null
    }

    return tiers.find(tier => tier.name === profile.subscription_tier)
  }

  const currentTier = getCurrentTierData()
  
  const getCreditsRemaining = () => {
    if (!profile) return 0
    const tierLimit = currentTier?.credits_per_month || 10
    return Math.max(0, tierLimit - (profile.queries_used || 0))
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="billing">My Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Subscription Status */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="credit-card" className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {currentTier ? currentTier.display_name : "Free Tier"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentTier 
                          ? `${currentTier.credits_per_month} credits per month` 
                          : "10 queries per month"}
                      </p>
                      <Badge className="mt-2" variant={currentTier ? "default" : "secondary"}>
                        {currentTier ? "Active" : "FREE"}
                      </Badge>
                    </div>
                    {currentTier && (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                        variant="outline"
                      >
                        <Icon name="settings" className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                  
                  {/* Credits Usage */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Credits Remaining</span>
                      <span className="text-sm font-bold">{getCreditsRemaining()} / {currentTier?.credits_per_month || 10}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ 
                          width: `${((getCreditsRemaining()) / (currentTier?.credits_per_month || 10)) * 100}%` 
                        }}
                      />
                    </div>
                    {profile?.rollover_credits && profile.rollover_credits > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        + {profile.rollover_credits} rollover credits available
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Additional Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="zap" className="h-5 w-5" />
                Purchase Additional Credits
              </CardTitle>
              <CardDescription>
                One-time credit packages that never expire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <Card key={pkg.credits} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="text-2xl font-bold">{pkg.credits}</div>
                      <div className="text-xs text-muted-foreground">Credits</div>
                      <div className="text-lg font-semibold">AED {pkg.price}</div>
                      <Button
                        onClick={() => handlePurchaseCredits(pkg.credits, pkg.price)}
                        disabled={loadingCredit}
                        size="sm"
                        className="w-full"
                      >
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => {
                const isCurrentTier = profile?.subscription_tier === tier.name
                const isPopular = tier.name === 'premium' || tier.name === 'premium_business'
                
                return (
                  <Card 
                    key={tier.id} 
                    className={`relative ${
                      isCurrentTier 
                        ? 'border-2 border-primary shadow-lg' 
                        : isPopular 
                          ? 'border-2 border-accent' 
                          : ''
                    }`}
                  >
                    {isPopular && !isCurrentTier && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent">
                        MOST POPULAR
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{tier.display_name}</CardTitle>
                      <div className="mt-4">
                        <div className="text-4xl font-bold">
                          AED {tier.price_monthly_aed}
                        </div>
                        <CardDescription className="mt-1">per month</CardDescription>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon name="check" className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">
                            {tier.credits_per_month} credits per month
                          </span>
                        </div>
                        {(tier.features as string[]).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Icon name="check" className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                        {['premium', 'essential_business', 'premium_business', 'enterprise'].includes(tier.name) && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Icon name="repeat" className="h-4 w-4 text-accent flex-shrink-0" />
                            <span className="text-sm font-medium text-accent">
                              Credit rollover enabled
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleSubscribe(tier)}
                        disabled={isLoading || isCurrentTier}
                        className="w-full"
                        variant={isCurrentTier ? "outline" : isPopular ? "default" : "outline"}
                      >
                        {isCurrentTier ? (
                          <>
                            <Icon name="check" className="h-4 w-4 mr-2" />
                            Current Plan
                          </>
                        ) : (
                          <>
                            <Icon name="credit-card" className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Refresh Subscription Status */}
          <div className="text-center">
            <Button
              onClick={checkSubscriptionStatus}
              variant="ghost"
              size="sm"
            >
              <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
              Refresh Subscription Status
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <PersonalBillingHistory onBackToSubscription={() => setActiveTab("subscription")} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}