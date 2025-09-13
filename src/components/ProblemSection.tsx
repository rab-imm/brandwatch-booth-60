import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export const ProblemSection = () => {
  const legalChallenges = [
    { challenge: "Document Hunt", task: "Hours searching through scattered UAE legal sources" },
    { challenge: "Language Barrier", task: "Arabic-English legal document translation struggles" },
    { challenge: "Version Control", task: "Which amendment is current? When did it take effect?" },
    { challenge: "Citation Accuracy", task: "Manual cross-referencing across federal and emirate laws" },
    { challenge: "Compliance Risk", task: "Missing recent regulatory updates and changes" }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Legal Research is Broken in the UAE
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Every legal professional faces these daily challenges:
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-12">
          {legalChallenges.map((challenge, index) => (
            <Card key={index} className="p-6 bg-card shadow-soft border-dashboard-border text-center">
              <div className="text-lg font-semibold text-brand-accent mb-2">{challenge.challenge}</div>
              <p className="text-sm text-muted-foreground">{challenge.task}</p>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-6">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meanwhile, international firms are accessing UAE legal information instantly with AI-powered research.
          </p>
          <Button variant="premium" size="lg">
            See the Solution
          </Button>
        </div>
      </div>
    </section>
  )
}