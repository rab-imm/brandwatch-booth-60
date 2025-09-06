import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const Features = () => {
  const features = [
    {
      icon: "brain",
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze sentiment, detect trends, and predict brand performance across all channels."
    },
    {
      icon: "lightning",
      title: "Real-time Monitoring",
      description: "Get instant alerts and updates as your brand mentions, competitor activities, and market dynamics change."
    },
    {
      icon: "target",
      title: "Precise Targeting",
      description: "Identify key influencers, brand advocates, and at-risk customers with sophisticated audience segmentation."
    },
    {
      icon: "globe",
      title: "Global Coverage",
      description: "Monitor your brand presence across 50+ languages and 200+ countries with comprehensive global insights."
    },
    {
      icon: "shield",
      title: "Crisis Prevention",
      description: "Early warning systems detect potential PR crises before they escalate, protecting your brand reputation."
    },
    {
      icon: "chart-bar",
      title: "Advanced Analytics",
      description: "Deep-dive analytics with custom reporting, trend analysis, and competitive benchmarking tools."
    }
  ]

  const stats = [
    { icon: "trending-up", label: "ROI Increase", value: "340%" },
    { icon: "clock", label: "Time Saved", value: "25 hrs/week" },
    { icon: "users", label: "Brands Trust Us", value: "500+" },
    { icon: "warning", label: "Crises Prevented", value: "1,200+" }
  ]

  return (
    <section id="features" className="py-20 px-6 bg-brand-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Powerful Features
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Everything you need for brand intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From real-time monitoring to predictive analytics, our platform provides 
            the complete toolkit for modern brand management.
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
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}