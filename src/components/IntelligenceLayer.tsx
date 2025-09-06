import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const IntelligenceLayer = () => {
  const flowSteps = [
    { icon: "dna", label: "Brand DNA", description: "Discovers and maps your brand identity" },
    { icon: "trending-up", label: "Trend Research", description: "Real-time analysis of what's working" },
    { icon: "brain", label: "Strategy", description: "Translates insights into actionable plans" },
    { icon: "rocket", label: "Campaign Assets", description: "Multi-format content generation" }
  ]

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            The Brain Behind the Factory
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlike template tools, CreateAI actually thinks. It discovers your brand, researches trends, 
            builds strategy, and generates campaigns — all while keeping humans in the loop.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {flowSteps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-8 bg-card shadow-card border-dashboard-border text-center h-full">
                <div className="w-16 h-16 rounded-full bg-brand-warm mx-auto mb-4 flex items-center justify-center">
                  <Icon name={step.icon} size={28} className="text-brand-accent" />
                </div>
                <h3 className="text-lg font-semibold text-brand-primary mb-3">
                  {step.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </Card>
              {index < flowSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <Icon name="arrow-right" size={24} className="text-brand-accent" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="premium" size="lg">
            Discover the Intelligence Layer
          </Button>
        </div>
      </div>
    </section>
  )
}