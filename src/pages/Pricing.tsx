import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const Pricing = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [tiers, setTiers] = useState<any[]>([])
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    fetchTiers()
  }, [])

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

  const handleSubscribe = async (tier: any) => {
    if (!user) {
      navigate("/auth")
      return
    }

    if (tier.name === 'free') {
      toast({
        title: "Already on Free Plan",
        description: "You're currently on the free plan. Upgrade to get more credits!",
      })
      return
    }

    if (tier.name === 'enterprise') {
      toast({
        title: "Contact Sales",
        description: "Please contact our sales team for Enterprise pricing.",
      })
      return
    }

    setLoading(tier.name)

    try {
      const priceId = isAnnual && tier.stripe_price_id_yearly 
        ? tier.stripe_price_id_yearly 
        : tier.stripe_price_id_monthly

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId }
      })

      if (error) throw error

      if (data?.url) {
        window.open(data.url, '_blank')
      }
    } catch (error: any) {
      console.error("Subscription error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const individualTiers = tiers.filter(t => 
    ['free', 'essential', 'premium'].includes(t.name)
  )

  const businessTiers = tiers.filter(t => 
    ['essential_business', 'premium_business', 'enterprise'].includes(t.name)
  )

  const renderTierCard = (tier: any, isCurrentPlan: boolean) => {
    const price = isAnnual ? tier.price_yearly_aed : tier.price_monthly_aed
    const savings = tier.price_yearly_aed > 0 
      ? Math.round(((tier.price_monthly_aed * 12 - tier.price_yearly_aed) / (tier.price_monthly_aed * 12)) * 100)
      : 0

    const isPopular = tier.name === 'premium' || tier.name === 'premium_business'

    return (
      <Card 
        key={tier.id} 
        className={`p-8 relative flex flex-col ${
          isCurrentPlan 
            ? 'border-2 border-primary shadow-lg' 
            : isPopular 
              ? 'border-2 border-accent shadow-md' 
              : 'border'
        }`}
      >
        {isCurrentPlan && (
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
            Your Plan
          </Badge>
        )}
        {!isCurrentPlan && isPopular && (
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent">
            Most Popular
          </Badge>
        )}

        <div className="space-y-6 flex-1">
          <div>
            <h3 className="text-2xl font-bold">{tier.display_name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
          </div>

          <div className="flex items-baseline gap-2">
            {tier.name === 'enterprise' ? (
              <span className="text-4xl font-bold">Custom</span>
            ) : (
              <>
                <span className="text-4xl font-bold">
                  AED {price}
                </span>
                <span className="text-muted-foreground">
                  {price > 0 ? `/${isAnnual ? 'year' : 'month'}` : ''}
                </span>
              </>
            )}
          </div>

          {isAnnual && savings > 0 && (
            <Badge variant="secondary" className="w-fit">
              Save {savings}%
            </Badge>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon name="zap" size={16} className="text-primary" />
              <span className="font-semibold">
                {tier.name === 'enterprise' 
                  ? 'Custom Credits' 
                  : `${tier.credits_per_month} credits/month`}
              </span>
            </div>
            {(['premium', 'essential_business', 'premium_business', 'enterprise'].includes(tier.name)) && (
              <div className="flex items-center gap-2">
                <Icon name="repeat" size={14} className="text-accent" />
                <span className="text-sm text-muted-foreground">Credit rollover enabled</span>
              </div>
            )}
          </div>

          <ul className="space-y-3">
            {(tier.features as string[]).map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <Icon name="check" size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
          className="w-full mt-6"
          onClick={() => handleSubscribe(tier)}
          disabled={loading !== null || isCurrentPlan}
        >
          {loading === tier.name ? (
            "Processing..."
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : tier.name === 'enterprise' ? (
            "Contact Sales"
          ) : tier.name === 'free' ? (
            "Get Started"
          ) : (
            "Subscribe Now"
          )}
        </Button>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start free, then choose the plan that fits your needs. From individuals to enterprises.
            </p>

            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : ""}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : ""}>
                Annual
                <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
              </Label>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-7xl">
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
                <TabsTrigger value="individual">Individual Plans</TabsTrigger>
                <TabsTrigger value="business">Business Plans</TabsTrigger>
              </TabsList>

              <TabsContent value="individual">
                <div className="grid lg:grid-cols-3 gap-8">
                  {individualTiers.map(tier => renderTierCard(
                    tier,
                    profile?.subscription_tier === tier.name
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="business">
                <div className="grid lg:grid-cols-3 gap-8">
                  {businessTiers.map(tier => renderTierCard(
                    tier,
                    profile?.subscription_tier === tier.name
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Credit Usage Guide */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Understanding Credit Usage
              </h2>
              <p className="text-xl text-muted-foreground">
                How credits are deducted for different operations
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge>1 Credit</Badge>
                  <h3 className="font-semibold">Basic Queries</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simple legal questions, short answers, basic document searches
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary">2 Credits</Badge>
                  <h3 className="font-semibold">Complex Queries</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multi-law analysis, detailed explanations, comprehensive research
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline">6 Credits</Badge>
                  <h3 className="font-semibold">Basic Templates</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Payment requests, resignation letters, simple contracts
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline">10 Credits</Badge>
                  <h3 className="font-semibold">Advanced Templates</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Employment contracts, tenancy agreements, detailed legal documents
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">
                  Do unused credits roll over?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Premium Individual and all Business plans include credit rollover. Unused credits carry over to the next month, up to 2x your monthly allocation.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">
                  Can I upgrade or downgrade anytime?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. Upgrades are instant with prorated billing. Downgrades take effect at your next billing cycle to ensure you don't lose paid credits.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">
                  What if I run out of credits mid-month?
                </h3>
                <p className="text-muted-foreground">
                  You can purchase credit top-ups anytime or upgrade your plan for instant access to more credits. Top-ups are available in various sizes to match your needs.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">
                  How does business plan credit sharing work?
                </h3>
                <p className="text-muted-foreground">
                  Business plans have a shared credit pool. Admins can allocate credits to team members, and all credits roll over monthly for maximum flexibility.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Pricing