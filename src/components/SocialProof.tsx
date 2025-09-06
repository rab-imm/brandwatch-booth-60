import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const SocialProof = () => {
  const testimonials = [
    {
      quote: "20 assets → 200 per week. Same team, no burnout.",
      company: "Velocity Agency",
      role: "Creative Director",
      avatar: "🚀"
    },
    {
      quote: "Finally AI that actually respects brand guidelines.",
      company: "Studio Black", 
      role: "Brand Manager",
      avatar: "⚡"
    },
    {
      quote: "Trend insights alone pay for it.",
      company: "Northern Digital",
      role: "Strategy Lead", 
      avatar: "🎯"
    }
  ]

  const stats = [
    { 
      icon: "clock",
      label: "less production time", 
      value: "87%",
      description: "From brief to final assets"
    },
    { 
      icon: "trending-up",
      label: "content output increase", 
      value: "10x",
      description: "Same team, more results"
    },
    { 
      icon: "target",
      label: "brief → campaign", 
      value: "2 hrs",
      description: "Average turnaround time"
    },
    { 
      icon: "check-circle",
      label: "first-approval rate", 
      value: "95%",
      description: "Client satisfaction guaranteed"
    }
  ]

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Trusted by 500+ Agencies
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Agencies Ship 10x More with CreateAI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real results from real agencies transforming their content production.
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