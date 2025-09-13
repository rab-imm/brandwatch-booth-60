import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import heroImage from "@/assets/dashboard-hero.jpg"

export const Hero = () => {
  return (
    <section className="py-20 px-6 bg-gradient-warm">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-brand-primary font-pact-display tracking-tight">
                Get UAE Legal Answers
                <span className="block text-brand-accent">in Minutes, Not Hours</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg font-pact-body">
                Ask any UAE legal question — employment, business, family law, and more. Get instant answers with verified citations from our comprehensive legal database.
              </p>
              <div className="bg-brand-warm/20 rounded-lg p-4 border border-brand-warm/30">
                <p className="text-lg font-semibold text-brand-primary mb-1">
                  🎯 3 Free Queries Every Month
                </p>
                <p className="text-sm text-muted-foreground">
                  No credit card required • Start asking legal questions instantly
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" className="group" asChild>
                <a href="#chat-demo">
                  Try 3 Free Queries
                  <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="group" asChild>
                <a href="/pricing">
                  <Icon name="message-circle" size={20} className="mr-2" />
                  See Pricing Plans
                </a>
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">50K+</div>
                <div className="text-sm text-muted-foreground">verified documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">All</div>
                <div className="text-sm text-muted-foreground">UAE jurisdictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">Instant</div>
                <div className="text-sm text-muted-foreground">AI answers</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-dashboard">
              <img 
                src={heroImage} 
                alt="UAE Legal Research Platform dashboard showing AI-powered document search and analysis" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}