import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const Features = () => {
  const featureCategories = [
    {
      title: "Document Intelligence",
      description: "AI that understands and processes complex UAE legal documents",
      features: [
        {
          name: "Arabic OCR Processing",
          description: "Advanced optical character recognition for Arabic legal documents with 99.8% accuracy."
        },
        {
          name: "Legal Language Translation", 
          description: "Context-aware translation between Arabic and English maintaining legal terminology precision."
        },
        {
          name: "Document Classification",
          description: "Automatic categorization by document type, jurisdiction, and legal subject matter."
        },
        {
          name: "Amendment Tracking",
          description: "Monitor changes, updates, and amendments across all legal documents automatically."
        },
        {
          name: "Citation Extraction",
          description: "Identify and map legal references, cross-references, and citation networks."
        }
      ],
      cta: "Explore Document Intelligence",
      icon: "file-search"
    },
    {
      title: "AI Legal Research",
      description: "Intelligent search and analysis across comprehensive UAE legal database",
      features: [
        {
          name: "Natural Language Queries",
          description: "Ask complex legal questions in plain English or Arabic and get accurate answers."
        },
        {
          name: "Multi-Jurisdiction Search",
          description: "Search across federal, emirate, DIFC, ADGM, and free zone regulations simultaneously."
        },
        {
          name: "Precedent Analysis",
          description: "Find relevant case law, court decisions, and regulatory precedents."
        },
        {
          name: "Risk Assessment",
          description: "AI evaluates legal risks and provides compliance recommendations."
        },
        {
          name: "Verified Citations",
          description: "Every answer includes proper legal citations with direct links to source documents."
        }
      ],
      cta: "Try Legal Research AI",
      icon: "brain"
    },
    {
      title: "Compliance Monitoring",
      description: "Real-time tracking of regulatory changes and compliance requirements",
      features: [
        {
          name: "Real-Time Updates",
          description: "Continuous monitoring of official sources for new regulations and amendments."
        },
        {
          name: "Impact Analysis",
          description: "Assess how regulatory changes affect your business or client matters."
        },
        {
          name: "Alert System",
          description: "Customizable notifications for specific practice areas or jurisdictions."
        },
        {
          name: "Compliance Calendar",
          description: "Track important dates, deadlines, and effective dates for new regulations."
        },
        {
          name: "Regulatory Reports",
          description: "Generate comprehensive compliance reports for clients and stakeholders."
        }
      ],
      cta: "Monitor Compliance",
      icon: "shield-check"
    },
    {
      title: "Professional Tools",
      description: "Advanced features for legal professionals and organizations",
      features: [
        {
          name: "Legal Research Reports",
          description: "Generate comprehensive, client-ready research reports with proper formatting."
        },
        {
          name: "Case Management Integration",
          description: "Export research findings directly to popular case management systems."
        },
        {
          name: "Team Collaboration",
          description: "Share research, annotate documents, and collaborate with colleagues."
        },
        {
          name: "API Access",
          description: "Integrate UAE legal research capabilities into your existing systems."
        },
        {
          name: "White-Label Options",
          description: "Brand the platform with your firm's identity for client presentations."
        }
      ],
      cta: "Explore Professional Tools",
      icon: "briefcase"
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
              Complete UAE Legal Research Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every feature you need for comprehensive legal research across all UAE jurisdictions.
            </p>
          </div>
        </section>

        {/* Feature Categories */}
        {featureCategories.map((category, index) => (
          <section key={index} className={`py-20 px-6 ${index % 2 === 0 ? 'bg-background' : 'bg-brand-secondary/10'}`}>
            <div className="container mx-auto max-w-6xl">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-xl bg-brand-warm flex items-center justify-center">
                    <Icon name={category.icon} size={32} className="text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold mb-4 text-brand-primary font-pact-display">
                      {category.title}
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8">
                      {category.description}
                    </p>
                    <Button variant="premium" size="lg">
                      {category.cta}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {category.features.map((feature, i) => (
                    <Card key={i} className="p-6 bg-card shadow-soft border-dashboard-border">
                      <h3 className="text-lg font-semibold text-brand-primary mb-3">
                        {feature.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Feature Stats */}
        <section className="py-20 px-6 bg-brand-secondary/20">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6">
              Platform Performance
            </Badge>
            <h2 className="text-4xl font-bold mb-12 text-brand-primary font-pact-display">
              Built for Reliability and Performance
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">99.8%</div>
                <div className="text-muted-foreground">Citation Accuracy</div>
              </Card>
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">&lt;30s</div>
                <div className="text-muted-foreground">Average Query Response</div>
              </Card>
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">50K+</div>
                <div className="text-muted-foreground">Legal Documents</div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Features