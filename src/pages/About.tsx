import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const About = () => {
  const teamMembers = [
    {
      name: "Dr. Ahmed Al-Rashid",
      role: "CEO & Co-Founder",
      background: "Former Legal Counsel at Emirates NBD, 15 years in UAE legal practice",
      avatar: "⚖️"
    },
    {
      name: "Sarah Johnson", 
      role: "CTO & Co-Founder",
      background: "Ex-AI Research Lead at Google, specialized in multilingual NLP",
      avatar: "🤖"
    },
    {
      name: "Dr. Fatima Al-Zahra",
      role: "Head of Legal Content", 
      background: "Former Judge at Dubai Courts, expert in UAE legal system",
      avatar: "👩‍⚖️"
    },
    {
      name: "Jasper",
      role: "Chief Security Officer",
      background: "Very good cat. Excellent at keeping legal documents secure (by sitting on them)",
      avatar: "🐱"
    }
  ]

  const values = [
    {
      title: "Legal Accuracy First",
      description: "Every citation, every reference, every answer is verified against official legal sources.",
      icon: "shield-check"
    },
    {
      title: "Cultural Understanding", 
      description: "Deep comprehension of UAE legal system, Islamic law principles, and cultural context.",
      icon: "globe"
    },
    {
      title: "Professional-Grade Security",
      description: "Enterprise security standards protecting sensitive legal information and client confidentiality.",
      icon: "lock"
    },
    {
      title: "Transparent Pricing",
      description: "Clear, fair pricing for legal professionals. No hidden fees, no surprise charges.",
      icon: "dollar-sign"
    }
  ]

  const milestones = [
    { year: "2022", event: "Founded by UAE legal practitioners frustrated with research inefficiency" },
    { year: "2023", event: "First Arabic legal document processing models developed" },
    { year: "2023", event: "Beta launch with select UAE law firms" },
    { year: "2024", event: "50K+ legal documents indexed across all UAE jurisdictions" },
    { year: "2024", event: "Leading law firms adopt platform, 99.8% citation accuracy achieved" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-warm">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Built by Legal Experts, for Legal Professionals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We understand UAE law. We built the solution.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Our Story</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                From Legal Research Pain to AI Solution
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <Card className="p-8 bg-card">
                <div className="space-y-6 text-muted-foreground">
                  <p className="text-lg leading-relaxed">
                    We spent 20 years practicing law in the UAE. We lived the frustration of scattered legal sources, 
                    inconsistent document formats, and the time-consuming process of manual legal research across 
                    multiple jurisdictions and languages.
                  </p>
                  <p className="text-lg leading-relaxed">
                    AI transformed many industries, but legal research remained stuck in the past. Tools were either 
                    too generic (ChatGPT) or focused on other legal systems. Nothing understood the unique complexity 
                    of UAE's multi-jurisdictional legal framework.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Our platform combines AI intelligence with legal precision: comprehensive document coverage, 
                    Arabic language processing, and verified citations. It's the tool we wished existed when we were 
                    drowning in research requests and tight client deadlines.
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
                Legal experts, AI researchers, UAE law specialists
              </h2>
              <p className="text-lg text-muted-foreground">
                One very smart cat named Jasper.
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
                Building the Future of Legal Research
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
              Join Us in Transforming Legal Research
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for talented people who share our mission to make legal research more accessible and efficient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg">
                View Careers
              </Button>
              <Button variant="outline" size="lg">
                Partner With Us
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default About