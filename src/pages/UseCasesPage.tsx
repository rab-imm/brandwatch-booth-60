import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const UseCasesPage = () => {
  const caseStudies = [
    {
      title: "Global Product Launch",
      company: "Major Sportswear Brand",
      industry: "Fashion & Sports",
      challenge: "Launch new sneaker line across 15 markets in record time",
      solution: "Used Trend-Informed mode to generate localized campaigns",
      results: [
        "300+ assets created in 3 days",
        "Localized to 15 languages", 
        "94% first-approval rate",
        "40% faster time-to-market"
      ],
      testimonial: "CreateAI helped us launch globally without losing our brand voice. The localization quality was incredible.",
      avatar: "👟",
      cta: "Read Full Case Study"
    },
    {
      title: "Always-On Social Strategy",
      company: "B2B SaaS Company",
      industry: "Technology",
      challenge: "Maintain consistent social presence without burning out creative team",
      solution: "Implemented Guided mode for systematic content creation",
      results: [
        "5 posts per day automated",
        "300% increase in content volume",
        "50% reduction in production time",
        "2x engagement rate improvement"
      ],
      testimonial: "We went from struggling to post twice a week to having a full content calendar months in advance.",
      avatar: "💻",
      cta: "Read Full Case Study"
    },
    {
      title: "Trend-Jacking Success",
      company: "Fashion Retailer",
      industry: "E-commerce",
      challenge: "React to trends fast enough to capture viral moments",
      solution: "Prescriptive mode for rapid response campaigns",
      results: [
        "Response time: 48h → 2h",
        "5x increase in viral content",
        "300% boost in trend engagement",
        "25% increase in sales from viral posts"
      ],
      testimonial: "We can now jump on trends while they're hot. Our speed-to-market is unmatched.",
      avatar: "👗",
      cta: "Read Full Case Study"
    }
  ]

  const workflows = [
    {
      title: "Product Launch Workflow",
      mode: "Trend-Informed",
      description: "Perfect for major launches requiring market research and trend analysis",
      steps: [
        "Market trend analysis",
        "Competitive landscape review", 
        "Strategic positioning",
        "Multi-format asset generation",
        "Localization and adaptation"
      ],
      timeframe: "3-5 days",
      outputCount: "50-100 assets",
      icon: "rocket"
    },
    {
      title: "Always-On Content Workflow",
      mode: "Guided",
      description: "Systematic content creation for consistent brand presence",
      steps: [
        "Content pillar definition",
        "Calendar planning",
        "Batch asset generation",
        "Quality review process",
        "Scheduling and publishing"
      ],
      timeframe: "2-3 hours weekly",
      outputCount: "20-30 assets",
      icon: "calendar"
    },
    {
      title: "Rapid Response Workflow", 
      mode: "Prescriptive",
      description: "Quick turnaround for trending topics and reactive content",
      steps: [
        "Trend identification",
        "Brand alignment check",
        "Rapid asset creation",
        "Fast-track approval",
        "Immediate publishing"
      ],
      timeframe: "1-2 hours",
      outputCount: "5-10 assets",
      icon: "lightning"
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
              Real Results from Real Agencies
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how agencies are transforming their content production with CreateAI
            </p>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Success Stories</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Case Studies
              </h2>
            </div>
            
            <div className="space-y-16">
              {caseStudies.map((study, index) => (
                <Card key={index} className="p-8 bg-card shadow-card border-dashboard-border">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{study.avatar}</div>
                        <div>
                          <h3 className="text-2xl font-bold text-brand-primary">{study.title}</h3>
                          <p className="text-brand-accent font-medium">{study.company}</p>
                          <p className="text-sm text-muted-foreground">{study.industry}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-brand-primary mb-2">Challenge</h4>
                        <p className="text-muted-foreground">{study.challenge}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-brand-primary mb-2">Solution</h4>
                        <p className="text-muted-foreground">{study.solution}</p>
                      </div>
                      
                      <blockquote className="border-l-4 border-brand-accent pl-4 italic text-muted-foreground">
                        "{study.testimonial}"
                      </blockquote>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-brand-primary mb-4">Results</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {study.results.map((result, i) => (
                            <div key={i} className="p-4 bg-brand-warm/20 rounded-lg text-center">
                              <div className="text-sm text-muted-foreground">{result}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button variant="premium" className="w-full">
                        {study.cta}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflows */}
        <section className="py-20 px-6 bg-brand-secondary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Workflow Examples</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Choose Your Workflow
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Different use cases require different approaches. Here's how agencies use our three modes.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {workflows.map((workflow, index) => (
                <Card key={index} className="p-8 bg-card shadow-card border-dashboard-border">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-xl bg-brand-warm flex items-center justify-center">
                      <Icon name={workflow.icon} size={28} className="text-brand-accent" />
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="mb-2">{workflow.mode}</Badge>
                      <h3 className="text-xl font-semibold text-brand-primary mb-3">
                        {workflow.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-brand-primary mb-3">Process Steps</h4>
                      <ol className="space-y-2">
                        {workflow.steps.map((step, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <span className="w-6 h-6 rounded-full bg-brand-accent text-white text-xs flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="font-medium">{workflow.timeframe}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Output:</span>
                        <span className="font-medium">{workflow.outputCount}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of agencies already transforming their content production with CreateAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default UseCasesPage