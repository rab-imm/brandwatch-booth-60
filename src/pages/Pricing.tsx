import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const Pricing = () => {
  const tiers = [
    {
      name: "Free",
      price: "AED 0",
      period: "",
      description: "Perfect for individuals getting started",
      features: [
        "10 queries per month",
        "Basic AI legal assistance",
        "UAE employment law focus",
        "Email support",
        "Single user account"
      ],
      cta: "Get Started",
      popular: false,
      highlight: "Most Popular for Individuals",
      priceId: null
    },
    {
      name: "Essential",
      price: "AED 20", 
      period: "/month",
      description: "For individuals and small businesses",
      features: [
        "50 queries per month",
        "3 free templates per month",
        "Additional templates at AED 20 each",
        "Priority support",
        "Document citations",
        "Export capabilities"
      ],
      cta: "Subscribe Now",
      popular: false,
      highlight: "",
      priceId: "price_1S70cyHsYn1ibhUiGg8DGg5g"
    },
    {
      name: "Premium",
      price: "AED 50",
      period: "/month", 
      description: "Ideal for legal professionals and growing firms",
      features: [
        "200 queries per month",
        "10 free templates per month",
        "Additional templates at AED 15 each",
        "Priority support",
        "Multi-user access (up to 5 users)",
        "Custom document generation",
        "Advanced search capabilities"
      ],
      cta: "Subscribe Now",
      popular: true,
      highlight: "Best Value"
    },
    {
      name: "SME",
      price: "AED 150",
      period: "/month",
      description: "For small to medium enterprises with extensive needs",
      features: [
        "Unlimited queries",
        "Unlimited templates",
        "Custom draft requests",
        "Dedicated support",
        "Multi-user access (up to 25 users)",
        "Custom integrations",
        "Advanced analytics",
        "White-label options"
      ],
      cta: "Subscribe Now",
      popular: false,
      highlight: "",
      priceId: "price_1S70f5HsYn1ibhUilLkxvekG"
    }
  ]

  const queryExamples = [
    { type: "Simple legal question", queries: "1 AI query" },
    { type: "Contract analysis", queries: "3-5 AI queries" },
    { type: "Compliance research", queries: "5-10 AI queries" },
    { type: "Due diligence project", queries: "20-50 AI queries" }
  ]

  const faqs = [
    {
      question: "What happens if I run out of queries?",
      answer: "You can upgrade your plan or purchase additional query packs. No service interruption."
    },
    {
      question: "Can I change plans anytime?", 
      answer: "Yes, upgrades are instant. Downgrades take effect at your next billing cycle."
    },
    {
      question: "Do unused queries roll over?",
      answer: "No, monthly queries reset each billing period to ensure fresh capacity."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes. 14 days with 50 free queries to test our platform."
    },
    {
      question: "Do you cover all UAE jurisdictions?",
      answer: "Yes, we cover federal laws, all seven emirates, DIFC, ADGM, and major free zones."
    },
    {
      question: "How accurate are the AI responses?",
      answer: "Our platform provides 99.8% citation accuracy with verified legal references and source links."
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, then choose the plan that fits your needs. From individuals to businesses to legal professionals.
          </p>
          <div className="mt-8 bg-brand-warm/20 rounded-lg p-4 border border-brand-warm/30 max-w-lg mx-auto">
            <p className="text-lg font-semibold text-brand-primary mb-1">
              🎯 Start with 3 Free Queries
            </p>
            <p className="text-sm text-muted-foreground">
              No credit card required • Try before you buy • Cancel anytime
            </p>
          </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-4 gap-8">
              {tiers.map((tier, index) => (
                <Card key={index} className={`p-8 relative ${tier.popular ? 'border-brand-accent shadow-dashboard' : 'border-dashboard-border'} ${tier.name === 'Free' ? 'bg-brand-warm/5' : ''}`}>
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-accent text-white">
                      {tier.highlight}
                    </Badge>
                  )}
                  {tier.name === 'Free' && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-warm text-white">
                      {tier.highlight}
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
                How Many Queries Do You Need?
              </h2>
              <p className="text-xl text-muted-foreground">
                Understanding credit usage for different types of legal research
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {queryExamples.map((example, index) => (
                <Card key={index} className="p-6 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{example.type}</span>
                    <span className="text-brand-accent font-semibold">{example.queries}</span>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button variant="premium" size="lg">
                Calculate Your Usage
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