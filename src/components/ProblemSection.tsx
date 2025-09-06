import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export const ProblemSection = () => {
  const weeklyStruggles = [
    { day: "Monday", task: "Client wants 'something viral' by Friday" },
    { day: "Tuesday", task: "6 hours researching trends that might already be dead" },
    { day: "Wednesday", task: "20 rounds of 'make the logo bigger'" },
    { day: "Thursday", task: "Panic-producing 15 variants for 5 platforms" },
    { day: "Friday", task: "Deliver content that's safe, not stellar" }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Your Creative Team is Drowning
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Every agency knows the pattern:
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-12">
          {weeklyStruggles.map((struggle, index) => (
            <Card key={index} className="p-6 bg-card shadow-soft border-dashboard-border text-center">
              <div className="text-lg font-semibold text-brand-accent mb-2">{struggle.day}:</div>
              <p className="text-sm text-muted-foreground">{struggle.task}</p>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-6">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meanwhile, your competitors are shipping 10x more content with half the team.
          </p>
          <Button variant="premium" size="lg">
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  )
}