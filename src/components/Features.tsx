import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

export const Features = () => {
  const features = [
    {
      icon: "brain",
      title: "Brand Intelligence",
      description: "Upload guidelines once or let AI discover them. Every asset follows your rules — colors, fonts, voice.",
      cta: "Explore Brand Intelligence"
    },
    {
      icon: "trending-up",
      title: "Trend Research",
      description: "AI-curated trend insights with citations. Know what's working before your client asks.",
      cta: "Explore Trend Research"
    },
    {
      icon: "target",
      title: "Strategy Synthesis",
      description: "Trends translated into content pillars, risk levels, and channel-ready campaigns.",
      cta: "See Strategy in Action"
    },
    {
      icon: "layers",
      title: "Multi-Format Generation",
      description: "Videos, carousels, posts, and copy variants generated in one pass.",
      cta: "Generate Content"
    },
    {
      icon: "users",
      title: "Human-in-the-Loop",
      description: "Review and approve at each checkpoint. No surprises, no rogue AI.",
      cta: "Review Workflow"
    },
    {
      icon: "lightning",
      title: "Bulk Operations",
      description: "Generate a month of content in an afternoon. Localize to 30 languages with one click.",
      cta: "Scale with Bulk Ops"
    },
    {
      icon: "share",
      title: "Direct Publishing",
      description: "Export perfectly formatted or publish directly to all platforms.",
      cta: "Publish Smarter"
    }
  ]

  const stats = [
    { icon: "clock", label: "Production Time", value: "87% less" },
    { icon: "rocket", label: "Content Output", value: "10x more" },
    { icon: "target", label: "Brief → Campaign", value: "2 hrs" },
    { icon: "check", label: "First-Approval Rate", value: "95%" }
  ]

  return (
    <section id="features" className="py-20 px-6 bg-brand-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Everything Your Agency Needs to Scale
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Everything Your Agency Needs to Scale
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From brand intelligence to bulk operations, our platform provides 
            the complete toolkit for modern content production.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-card shadow-soft border-dashboard-border">
              <Icon name={stat.icon} size={32} className="mx-auto mb-3 text-brand-accent" />
              <div className="text-2xl font-bold text-brand-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 bg-card shadow-card border-dashboard-border hover:shadow-dashboard transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-warm flex items-center justify-center">
                  <Icon name={feature.icon} size={24} className="text-brand-accent" />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <Button variant="outline" size="sm">
                  {feature.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}