import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const IntelligenceLayer = () => {
  const flowSteps = [
    { icon: "file-search", label: "Document Discovery", description: "AI-powered scraping of all UAE legal sources" },
    { icon: "language", label: "Arabic Processing", description: "Advanced OCR and translation for Arabic documents" },
    { icon: "brain", label: "Legal Analysis", description: "AI understands context, amendments, and relationships" },
    { icon: "message-circle", label: "Instant Answers", description: "Chat interface with proper citations and risk assessment" }
  ]

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            AI That Understands UAE Law
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our RAG-powered system continuously monitors official UAE legal sources, processes Arabic documents, 
            tracks amendments, and provides instant research with verified citations — like having a legal research team that never sleeps.
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
            See Legal AI in Action
          </Button>
        </div>
      </div>
    </section>
  )
}