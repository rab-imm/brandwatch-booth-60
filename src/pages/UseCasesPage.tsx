import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const UseCasesPage = () => {
  const caseStudies = [
    {
      title: "M&A Due Diligence",
      company: "International Investment Firm",
      industry: "Financial Services",
      challenge: "Complete legal due diligence for UAE acquisition in record time",
      solution: "Used comprehensive research mode to analyze regulatory compliance",
      results: [
        "200+ legal documents analyzed in 2 days",
        "Cross-referenced across 5 jurisdictions", 
        "95% faster than traditional research",
        "30% reduction in legal costs"
      ],
      testimonial: "The platform identified regulatory risks we would have missed. Saved us weeks of manual research.",
      avatar: "🏢",
      cta: "Read Full Case Study"
    },
    {
      title: "Corporate Compliance Audit",
      company: "Major UAE Corporation",
      industry: "Manufacturing",
      challenge: "Ensure compliance across multiple UAE jurisdictions and free zones",
      solution: "Implemented compliance monitoring for real-time regulatory tracking",
      results: [
        "24/7 compliance monitoring",
        "100% regulatory change detection",
        "80% reduction in compliance risks",
        "50% faster regulatory response"
      ],
      testimonial: "We now catch regulatory changes the day they're published. Our compliance team is always ahead.",
      avatar: "🏭",
      cta: "Read Full Case Study"
    },
    {
      title: "Complex Litigation Research",
      company: "Leading UAE Law Firm",
      industry: "Legal Services",
      challenge: "Find precedents for complex cross-border commercial dispute",
      solution: "Legal AI assistant for comprehensive precedent and case law research",
      results: [
        "Research time: 40h → 4h",
        "Identified 50+ relevant precedents",
        "Cross-jurisdictional analysis",
        "Client case won at first instance"
      ],
      testimonial: "The AI found precedents our senior associates missed. It's like having a research team that never sleeps.",
      avatar: "⚖️",
      cta: "Read Full Case Study"
    }
  ]

  const workflows = [
    {
      title: "Contract Analysis Workflow",
      mode: "Comprehensive Research",
      description: "Deep analysis for complex commercial agreements and regulatory compliance",
      steps: [
        "Document upload and processing",
        "Regulatory compliance check", 
        "Risk assessment analysis",
        "Cross-reference verification",
        "Detailed report generation"
      ],
      timeframe: "2-4 hours",
      outputCount: "Comprehensive analysis",
      icon: "file-text"
    },
    {
      title: "Legal Research Workflow",
      mode: "AI Assistant",
      description: "Interactive research for ongoing matters and general legal queries",
      steps: [
        "Query formulation",
        "AI-powered document search",
        "Citation verification",
        "Precedent analysis",
        "Research summary delivery"
      ],
      timeframe: "15-30 minutes",
      outputCount: "Verified answers",
      icon: "search"
    },
    {
      title: "Compliance Monitoring Workflow", 
      mode: "Real-time Monitoring",
      description: "Continuous tracking of regulatory changes and compliance requirements",
      steps: [
        "Source monitoring setup",
        "Automated change detection",
        "Impact assessment",
        "Alert notification",
        "Compliance update delivery"
      ],
      timeframe: "Continuous",
      outputCount: "Real-time updates",
      icon: "shield-check"
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
              Real Results from UAE Legal Professionals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how law firms and legal departments are transforming their research with our platform
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
                Choose Your Research Approach
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Different legal matters require different research approaches. Here's how professionals use our platform.
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
              Ready to Transform Your Legal Research?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading UAE law firms already using our platform for faster, more accurate legal research.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg">
                Start Research Trial
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