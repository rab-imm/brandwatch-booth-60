import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"

const About = () => {
  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      background: "Ex-Creative Director at Ogilvy, 12 years in agencies",
      avatar: "👩‍💼"
    },
    {
      name: "Marcus Rodriguez", 
      role: "CTO & Co-Founder",
      background: "Former AI Research Lead at Meta, built content systems at scale",
      avatar: "👨‍💻"
    },
    {
      name: "Aisha Patel",
      role: "Head of Product", 
      background: "Ex-Adobe Creative Cloud, designed tools used by millions",
      avatar: "👩‍🎨"
    },
    {
      name: "Deploy",
      role: "Chief Happiness Officer",
      background: "Good dog. Excellent at debugging (by sleeping on keyboards)",
      avatar: "🐕"
    }
  ]

  const values = [
    {
      title: "Speed with Control",
      description: "Fast doesn't mean reckless. We give you velocity without sacrificing quality or brand integrity.",
      icon: "rocket"
    },
    {
      title: "Radical Transparency", 
      description: "No hidden fees, no surprise limitations. What you see is what you get, always.",
      icon: "eye"
    },
    {
      title: "Agency-First Design",
      description: "Every feature is built around real agency workflows. We solve real problems, not invented ones.",
      icon: "users"
    },
    {
      title: "No BS Pricing",
      description: "Clear pricing, fair usage, no 'contact sales' nonsense. Respect your time and budget.",
      icon: "dollar-sign"
    }
  ]

  const milestones = [
    { year: "2023", event: "Founded by agency veterans tired of broken tools" },
    { year: "2023", event: "First AI models trained on agency-quality content" },
    { year: "2024", event: "Beta launch with 50 select agencies" },
    { year: "2024", event: "500+ agencies join the platform" },
    { year: "2025", event: "1M+ assets created, expanding globally" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-warm">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Built by Agency People, for Agency People
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We lived the pain. We built the fix.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Our Story</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                From Agency Pain to AI Solution
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <Card className="p-8 bg-card">
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg leading-relaxed">
                    We spent 15 years in agencies. We lived the 2am renders, the broken workflows, 
                    the endless client revisions. We watched talented creatives burn out producing 
                    content that was safe, not stellar.
                  </p>
                  <p className="text-lg leading-relaxed">
                    AI changed everything — except agency creative. Tools were either too robotic 
                    (templates) or too random (ChatGPT). Nothing understood the unique pressures 
                    of agency life: tight deadlines, brand guidelines, client expectations.
                  </p>
                  <p className="text-lg leading-relaxed">
                    CreateAI combines AI intelligence with agency discipline: research + strategy + 
                    brand guardrails. It's the tool we wished existed when we were drowning in 
                    production requests.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 px-6 bg-brand-secondary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Meet the Team</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Ex-creative directors, AI researchers, engineers from Meta/Google/Adobe
              </h2>
              <p className="text-lg text-muted-foreground">
                One good dog named Deploy.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="p-6 bg-card text-center">
                  <div className="text-6xl mb-4">{member.avatar}</div>
                  <h3 className="text-xl font-semibold text-brand-primary mb-2">
                    {member.name}
                  </h3>
                  <div className="text-brand-accent font-medium mb-3">
                    {member.role}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.background}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Our Values</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                What Drives Us
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="p-8 bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-warm flex items-center justify-center">
                      <Icon name={value.icon} size={24} className="text-brand-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-primary mb-3">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 px-6 bg-brand-secondary/10">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Our Journey</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Building the Future of Agency Content
              </h2>
            </div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <Card key={index} className="p-6 bg-card">
                  <div className="flex items-center space-x-6">
                    <div className="text-2xl font-bold text-brand-accent min-w-[80px]">
                      {milestone.year}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {milestone.event}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
              Join Us in Transforming Agency Work
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for talented people who share our mission to make agency life better.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg">
                View Open Positions
              </Button>
              <Button variant="outline" size="lg">
                Partner With Us
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-brand-primary mb-4">CreateAI</h3>
            <p className="text-sm text-muted-foreground">
              CreateAI © 2025 • Built for agencies, by agency people • SOC 2 Type II Certified
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About