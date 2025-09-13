import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const ThreeModePipeline = () => {
  const steps = [
    {
      number: "1",
      icon: "message-circle",
      title: "Ask Your Question",
      description: "Type any UAE legal question in plain English. Employment, business, family law - we cover it all.",
      example: "\"Can my employer reduce my salary?\""
    },
    {
      number: "2", 
      icon: "brain",
      title: "AI Analyzes UAE Law",
      description: "Our AI searches through 50,000+ verified legal documents across all UAE jurisdictions.",
      example: "Checking Labour Law, Civil Code, Federal regulations..."
    },
    {
      number: "3",
      icon: "file-text",
      title: "Get Answer with Sources",
      description: "Receive clear answers with direct citations to specific laws and regulations.",
      example: "UAE Labour Law Article 83 + Ministerial Resolution links"
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get accurate UAE legal guidance in three simple steps - no legal expertise required
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-8 bg-card border-dashboard-border hover:shadow-dashboard transition-all duration-300 relative">
              {/* Step Number */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
              </div>
              
              <div className="space-y-6 pt-4">
                <div className="w-16 h-16 rounded-xl bg-brand-warm/20 flex items-center justify-center">
                  <Icon name={step.icon} size={28} className="text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>
                  <div className="bg-brand-warm/10 rounded-lg p-3 border border-brand-warm/20">
                    <p className="text-sm text-brand-primary font-medium">
                      {step.example}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="premium" size="lg" className="group">
            Try Your First Question Free
            <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            3 free queries • No credit card required • Instant access
          </p>
        </div>
      </div>
    </section>
  )
}