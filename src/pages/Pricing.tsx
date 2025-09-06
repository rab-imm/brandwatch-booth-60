import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const Pricing = () => {
  const tiers = [
    {
      name: "Starter",
      price: "$299",
      period: "/month",
      description: "Perfect for small agencies getting started",
      features: [
        "3 team members",
        "5 brands",
        "1,000 credits/month",
        "All content types",
        "Basic analytics",
        "Email support"
      ],
      cta: "Choose Starter",
      popular: false
    },
    {
      name: "Professional",
      price: "$899", 
      period: "/month",
      description: "Most popular choice for growing agencies",
      features: [
        "10 team members",
        "25 brands", 
        "5,000 credits/month",
        "Priority generation",
        "Advanced analytics",
        "Client preview links",
        "Slack support"
      ],
      cta: "Choose Professional",
      popular: true
    },
    {
      name: "Agency",
      price: "$2,499",
      period: "/month", 
      description: "For established agencies scaling fast",
      features: [
        "30 team members",
        "Unlimited brands",
        "20,000 credits/month", 
        "Fastest generation",
        "Custom integrations",
        "Dedicated success manager",
        "SLA guarantee"
      ],
      cta: "Choose Agency",
      popular: false
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Tailored solutions for enterprise needs",
      features: [
        "Unlimited everything",
        "Custom AI training",
        "On-premise option",
        "White-label available", 
        "Dedicated infrastructure",
        "24/7 phone support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ]

  const creditExamples = [
    { type: "1 post", credits: "≈ 5 credits" },
    { type: "1 30s video", credits: "≈ 150 credits" },
    { type: "1 carousel (5 slides)", credits: "≈ 25 credits" },
    { type: "1 campaign (20 posts + 3 videos + 5 carousels)", credits: "≈ 500 credits" }
  ]

  const faqs = [
    {
      question: "What happens if I run out of credits?",
      answer: "Buy packs anytime or upgrade your plan. No service interruption."
    },
    {
      question: "Can I change plans anytime?", 
      answer: "Yes, upgrades are instant. Downgrades at billing cycle end."
    },
    {
      question: "Do unused credits roll over?",
      answer: "Monthly credits expire, but packs don't."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes. 14 days with 500 credits."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-warm">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Transparent Pricing That Scales With You
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No surprises. No overage fees. No "contact us for pricing" nonsense.
            </p>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-4 gap-8">
              {tiers.map((tier, index) => (
                <Card key={index} className={`p-8 relative ${tier.popular ? 'border-brand-accent shadow-dashboard' : 'border-dashboard-border'}`}>
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-accent text-white">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-brand-primary">{tier.name}</h3>
                      <div className="flex items-baseline mt-2">
                        <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                    </div>
                    
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center space-x-3">
                          <Icon name="check" size={16} className="text-brand-accent" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      variant={tier.popular ? "premium" : "outline"} 
                      className="w-full"
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Credit Calculator */}
        <section className="py-20 px-6 bg-brand-secondary/20">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                What Do Credits Get You?
              </h2>
              <p className="text-xl text-muted-foreground">
                Understanding our credit system and what you can create
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {creditExamples.map((example, index) => (
                <Card key={index} className="p-6 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{example.type}</span>
                    <span className="text-brand-accent font-semibold">{example.credits}</span>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button variant="premium" size="lg">
                Calculate Your Campaign
              </Button>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-center text-brand-primary font-pact-display">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="p-6 bg-card">
                  <h3 className="text-lg font-semibold text-brand-primary mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Pricing