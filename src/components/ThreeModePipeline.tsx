import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const ThreeModePipeline = () => {
  const researchModes = [
    {
      icon: "file-search",
      title: "Comprehensive Research",
      description: "AI searches across all UAE legal sources and provides detailed analysis with full citations.",
      cta: "Try Comprehensive Search",
      gradient: "bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"
    },
    {
      icon: "message-circle",
      title: "Legal AI Assistant",
      description: "Chat with AI that understands UAE law, get instant answers with risk assessments.",
      cta: "Ask Legal Questions",
      gradient: "bg-gradient-to-br from-brand-accent/10 to-brand-warm/20"
    },
    {
      icon: "shield-check",
      title: "Compliance Monitoring",
      description: "Stay updated with real-time changes, amendments, and new regulations across all jurisdictions.",
      cta: "Monitor Compliance",
      gradient: "bg-gradient-to-br from-brand-warm/20 to-brand-secondary/10"
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Three Ways to Research UAE Law
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flexible research modes designed for different legal professional needs and case complexities.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {researchModes.map((mode, index) => (
            <Card key={index} className={`p-8 ${mode.gradient} border-dashboard-border hover:shadow-dashboard transition-all duration-300`}>
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-xl bg-brand-warm flex items-center justify-center">
                  <Icon name={mode.icon} size={28} className="text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {mode.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {mode.description}
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  {mode.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}