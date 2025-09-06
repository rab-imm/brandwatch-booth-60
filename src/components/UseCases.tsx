import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const UseCases = () => {
  const useCases = [
    {
      title: "Product Launches",
      subtitle: "Trend-Informed",
      description: "Generate 50+ assets across all channels from a single brief. Hero videos, social posts, ads — all coordinated and on-brand.",
      cta: "See Launch Workflow",
      icon: "rocket",
      gradient: "bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"
    },
    {
      title: "Always-On Content", 
      subtitle: "Guided",
      description: "Keep calendars full without burnout. Set content pillars once, generate weeks of variations.",
      cta: "See Always-On Workflow",
      icon: "calendar",
      gradient: "bg-gradient-to-br from-brand-accent/10 to-brand-warm/20"
    },
    {
      title: "Rapid Response",
      subtitle: "Prescriptive", 
      description: "Jump on trends in minutes, not days. Perfect for reactive client asks.",
      cta: "See Rapid Response",
      icon: "lightning",
      gradient: "bg-gradient-to-br from-brand-warm/20 to-brand-secondary/10"
    },
    {
      title: "Global Campaigns",
      subtitle: "Any Mode",
      description: "One campaign, 30 markets. Automatic localization with nuance, not just translation.",
      cta: "See Global Campaigns", 
      icon: "globe",
      gradient: "bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10"
    }
  ]

  return (
    <section id="use-cases" className="py-20 px-6 bg-brand-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Real-World Applications
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Built for How Agencies Actually Work
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether it's a major launch or daily content needs, CreateAI adapts to your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <Card key={index} className={`p-8 ${useCase.gradient} border-dashboard-border hover:shadow-dashboard transition-all duration-300`}>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-xl bg-brand-warm flex items-center justify-center">
                    <Icon name={useCase.icon} size={28} className="text-brand-accent" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {useCase.subtitle}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {useCase.description}
                  </p>
                </div>
                
                <Button variant="outline" className="w-full">
                  {useCase.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}