import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const LegalDisclaimers = () => {
  const disclaimers = [
    {
      icon: "info-circle",
      title: "Preliminary Legal Guidance",
      description: "Our AI provides general information and preliminary guidance based on UAE law. This is not formal legal advice and should not be considered as such."
    },
    {
      icon: "user-check",
      title: "Consult a Licensed Attorney",
      description: "For specific legal matters, complex situations, or formal legal representation, always consult with a qualified UAE-licensed attorney."
    },
    {
      icon: "shield-off",
      title: "No Attorney-Client Relationship",
      description: "Using this platform does not create an attorney-client relationship. We are a legal research tool, not a law firm."
    },
    {
      icon: "alert-triangle",
      title: "Verify Information",
      description: "While our sources are verified and updated regularly, laws can change. Always verify current legal requirements for critical decisions."
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-warm/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Important Legal Information
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Understanding the scope and limitations of our AI legal guidance platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {disclaimers.map((disclaimer, index) => (
            <Card key={index} className="p-6 bg-card border-dashboard-border">
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-lg bg-brand-warm/20 flex items-center justify-center flex-shrink-0">
                  <Icon name={disclaimer.icon} size={20} className="text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary mb-2">
                    {disclaimer.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {disclaimer.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-gradient-to-br from-brand-secondary/10 to-brand-accent/5 border-brand-secondary/20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto">
              <Icon name="scale" size={28} className="text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-brand-primary">
              When to Consult a Lawyer
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                "Contract disputes or negotiations",
                "Court proceedings or litigation", 
                "Business formation or compliance",
                "Employment termination issues",
                "Property transactions",
                "Family law matters"
              ].map((situation, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Icon name="check" size={16} className="text-brand-accent flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{situation}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
              Our platform provides an excellent starting point for understanding UAE law, 
              but professional legal counsel is essential for formal legal matters.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}