import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const ThreeModePipeline = () => {
  const modes = [
    {
      icon: "trending-up",
      title: "Trend-Informed Intelligence",
      description: "Fresh ideas and campaign launches powered by real trend research.",
      cta: "Run Trend-Informed Demo",
      gradient: "bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"
    },
    {
      icon: "compass",
      title: "Guided Creation",
      description: "Clear briefs become strategies and assets without the research step.",
      cta: "Try Guided Mode",
      gradient: "bg-gradient-to-br from-brand-accent/10 to-brand-warm/20"
    },
    {
      icon: "target",
      title: "Prescriptive Production",
      description: "Direct, pixel-perfect production when the client already knows what they want.",
      cta: "Use Prescriptive Mode",
      gradient: "bg-gradient-to-br from-brand-warm/20 to-brand-secondary/10"
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Choose the Flow That Fits
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three intelligent workflows designed around how your agency actually works.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {modes.map((mode, index) => (
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