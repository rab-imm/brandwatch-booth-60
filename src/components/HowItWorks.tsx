import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Tell Us What You Need",
      description: "Drop in a brief or describe the campaign. Our AI understands context, not just keywords.",
      cta: "Write a Brief",
      icon: "edit"
    },
    {
      number: "02", 
      title: "We Research, Strategize & Create",
      description: "AI analyzes trends, builds strategy, and generates videos, carousels, and copy in every format.",
      cta: "See the Pipeline",
      icon: "brain"
    },
    {
      number: "03",
      title: "Review, Refine & Ship",
      description: "Approve what works, adjust what doesn't, export everything ready-to-publish.",
      cta: "Preview Content Gallery",
      icon: "rocket"
    }
  ]

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            From Brief to Brilliant in 3 Steps
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI-native workflow transforms your ideas into production-ready campaigns faster than ever.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-8 bg-card shadow-card border-dashboard-border hover:shadow-dashboard transition-all duration-300 h-full">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-bold text-brand-accent opacity-30">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-warm flex items-center justify-center">
                      <Icon name={step.icon} size={24} className="text-brand-accent" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    {step.cta}
                  </Button>
                </div>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-8 rounded-full bg-brand-warm flex items-center justify-center">
                    <Icon name="arrow-right" size={20} className="text-brand-accent" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}