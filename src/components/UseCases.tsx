import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"

export const UseCases = () => {
  const useCases = [
    {
      title: "Contract Analysis",
      subtitle: "Commercial Law",
      description: "Analyze commercial contracts against UAE Commercial Companies Law and DIFC regulations. Get risk assessments and compliance recommendations.",
      cta: "Try Contract Analysis",
      icon: "file-text",
      gradient: "bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"
    },
    {
      title: "Regulatory Compliance", 
      subtitle: "Multi-Jurisdiction",
      description: "Stay compliant across federal, emirate, and free zone regulations. Monitor changes and get instant impact assessments.",
      cta: "Monitor Compliance",
      icon: "shield-check",
      gradient: "bg-gradient-to-br from-brand-accent/10 to-brand-warm/20"
    },
    {
      title: "Legal Due Diligence",
      subtitle: "Corporate Law", 
      description: "Research corporate structures, licensing requirements, and regulatory obligations for M&A and investment decisions.",
      cta: "Research Due Diligence",
      icon: "search",
      gradient: "bg-gradient-to-br from-brand-warm/20 to-brand-secondary/10"
    },
    {
      title: "Litigation Support",
      subtitle: "Case Research",
      description: "Find relevant precedents, statutes, and regulatory guidance across UAE courts and arbitration centers.",
      cta: "Research Precedents", 
      icon: "gavel",
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
            Built for Every Legal Practice Area
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From corporate transactions to litigation support, our platform adapts to your specific legal research needs.
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