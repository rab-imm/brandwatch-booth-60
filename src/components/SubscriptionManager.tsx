import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

const SUBSCRIPTION_TIERS = {
  essential: {
    priceId: "price_1S70cyHsYn1ibhUiGg8DGg5g",
    productId: "prod_T36q2YZxwwwUnK",
    name: "Essential",
    price: "AED 20",
    features: [
      "50 queries per month",
      "3 free templates per month",
      "Additional templates at AED 20",
      "Priority support"
    ]
  },
  premium: {
    priceId: "price_1S70efHsYn1ibhUiTUpAIZ8I",
    productId: "prod_T36sS4URaappUY",
    name: "Premium",
    price: "AED 50",
    features: [
      "200 queries per month",
      "10 free templates per month",
      "Additional templates at AED 15",
      "Multi-user access (5 users)",
      "Custom document generation"
    ]
  },
  sme: {
    priceId: "price_1S70f5HsYn1ibhUilLkxvekG",
    productId: "prod_T36sp38yi1POiY",
    name: "SME",
    price: "AED 150",
    features: [
      "Unlimited queries",
      "Unlimited templates",
      "Custom draft requests",
      "Multi-user access (25 users)",
      "Dedicated support"
    ]
  }
}

export const SubscriptionManager = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus()
    }
  }, [user])

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription')
      if (error) throw error
      
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubscribe = async (priceId: string) => {
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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      })

      if (error) throw error

      if (data.url) {
        window.open(data.url, '_blank')
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

  const getCurrentTier = () => {
    if (!subscriptionStatus?.subscribed || !subscriptionStatus?.product_id) {
      return null
    }

    return Object.values(SUBSCRIPTION_TIERS).find(
      tier => tier.productId === subscriptionStatus.product_id
    )
  }

  const currentTier = getCurrentTier()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="flex items-center justify-between">
              <div>
                {currentTier ? (
                  <>
                    <h3 className="text-lg font-semibold">{currentTier.name}</h3>
                    <p className="text-muted-foreground">{currentTier.price}/month</p>
                    <Badge className="mt-2">Active</Badge>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Free Tier</h3>
                    <p className="text-muted-foreground">10 queries per month</p>
                    <Badge variant="secondary" className="mt-2">Free</Badge>
                  </>
                )}
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
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isCurrentTier = currentTier?.productId === tier.productId
          
          return (
            <Card key={key} className={`relative ${key === 'premium' ? 'border-primary shadow-lg' : ''}`}>
              {key === 'premium' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle>{tier.name}</CardTitle>
                <div className="text-3xl font-bold">{tier.price}</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Icon name="check" className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(tier.priceId)}
                  disabled={isLoading || isCurrentTier}
                  className="w-full"
                  variant={isCurrentTier ? "secondary" : key === 'premium' ? "default" : "outline"}
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
    </div>
  )
}