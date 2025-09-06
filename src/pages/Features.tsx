import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const Features = () => {
  const featureCategories = [
    {
      title: "Brand Intelligence",
      description: "AI that understands and preserves your brand identity",
      features: [
        {
          name: "Visual DNA Mapping",
          description: "Automatically extract color palettes, typography, and design patterns from your existing materials."
        },
        {
          name: "Voice Profiling", 
          description: "Learn your brand's tone, messaging style, and communication patterns from past content."
        },
        {
          name: "Audience Personas",
          description: "Build detailed customer profiles based on engagement data and brand interactions."
        },
        {
          name: "Competitive Differentiation",
          description: "Identify what makes your brand unique in the competitive landscape."
        },
        {
          name: "Auto-Discovery from URL",
          description: "Input your website URL and let AI discover your brand guidelines automatically."
        }
      ],
      cta: "Explore Brand Intelligence",
      icon: "brain"
    },
    {
      title: "Content Generation",
      description: "Multi-format content creation that stays on-brand",
      features: [
        {
          name: "Video Generation",
          description: "Create engaging video content from scripts to final edit, optimized for each platform."
        },
        {
          name: "Image & Carousel Creation",
          description: "Generate stunning visuals and multi-slide carousels that tell your story."
        },
        {
          name: "Copy & Captions",
          description: "Platform-specific copy that matches your voice and drives engagement."
        },
        {
          name: "Platform-Specific Variants",
          description: "One concept, multiple formats - Instagram, TikTok, LinkedIn, and more."
        },
        {
          name: "Brand-Safe Outputs",
          description: "Every piece of content follows your guidelines - colors, fonts, voice, every time."
        }
      ],
      cta: "See Generation in Action",
      icon: "layers"
    },
    {
      title: "Workflow Control",
      description: "Human oversight at every step of the process",
      features: [
        {
          name: "Multi-Gate Approval",
          description: "Review and approve at Brief → Research → Strategy → Review → Final sign-off."
        },
        {
          name: "Full Audit Trail",
          description: "Track every decision, edit, and approval throughout the content creation process."
        },
        {
          name: "Role-Based Permissions",
          description: "Control who can view, edit, and approve content at each stage."
        },
        {
          name: "Version Control",
          description: "Track changes and revert to previous versions with complete revision history."
        },
        {
          name: "Quality Checkpoints",
          description: "Automated brand compliance checks at every stage of production."
        }
      ],
      cta: "Explore Workflow Control",
      icon: "shield"
    },
    {
      title: "Collaboration",
      description: "Seamless teamwork and client communication",
      features: [
        {
          name: "Real-Time Collaboration",
          description: "Multiple team members can work on campaigns simultaneously with conflict resolution."
        },
        {
          name: "Comments & @Mentions",
          description: "Leave feedback, tag team members, and maintain context throughout the project."
        },
        {
          name: "Client Preview Links",
          description: "Share password-protected previews with clients for feedback and approval."
        },
        {
          name: "Team Activity Feed",
          description: "Stay updated on project progress with real-time notifications and updates."
        },
        {
          name: "Integration Hub",
          description: "Connect with Slack, Trello, Asana, and other tools your team already uses."
        }
      ],
      cta: "Explore Collaboration",
      icon: "users"
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
              Every Feature You Need, None You Don't
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              CreateAI is built with agencies, for agencies. Every feature solves a real workflow pain.
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
              Built for Scale and Speed
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime Guarantee</div>
              </Card>
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">&lt;30s</div>
                <div className="text-muted-foreground">Average Generation Time</div>
              </Card>
              <Card className="p-8 bg-card text-center">
                <div className="text-4xl font-bold text-brand-primary mb-2">50+</div>
                <div className="text-muted-foreground">Output Formats</div>
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