import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const SocialProof = () => {
  const testimonials = [
    {
      quote: "Research that used to take 6 hours now takes 15 minutes. Game-changing for our practice.",
      company: "Al Tamimi & Company",
      role: "Senior Partner",
      avatar: "⚖️"
    },
    {
      quote: "Finally, UAE legal research that understands Arabic context and provides accurate citations.",
      company: "BSA Ahmad Bin Hezeem", 
      role: "Legal Counsel",
      avatar: "🏛️"
    },
    {
      quote: "The compliance monitoring alone saves us thousands in potential regulatory risks.",
      company: "Hadef & Partners",
      role: "Compliance Director", 
      avatar: "🛡️"
    }
  ]

  const stats = [
    { 
      icon: "clock",
      label: "faster research time", 
      value: "90%",
      description: "From question to verified answer"
    },
    { 
      icon: "file-text",
      label: "legal documents indexed", 
      value: "50K+",
      description: "Across all UAE jurisdictions"
    },
    { 
      icon: "target",
      label: "average response time", 
      value: "< 30s",
      description: "For complex legal queries"
    },
    { 
      icon: "check-circle",
      label: "citation accuracy rate", 
      value: "99.8%",
      description: "Verified legal references"
    }
  ]

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Trusted by Leading UAE Law Firms
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Legal Professionals Research 10x Faster
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real results from leading law firms transforming their legal research process.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-card shadow-soft border-dashboard-border">
              <Icon name={stat.icon} size={32} className="mx-auto mb-3 text-brand-accent" />
              <div className="text-3xl font-bold text-brand-primary mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 bg-card shadow-card border-dashboard-border">
              <div className="space-y-6">
                <div className="text-4xl">{testimonial.avatar}</div>
                <blockquote className="text-lg font-medium text-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="space-y-1">
                  <div className="font-semibold text-brand-primary">{testimonial.company}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}