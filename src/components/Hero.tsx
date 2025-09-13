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
                UAE Legal Research.
                <span className="block text-brand-accent">Finally Simplified.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg font-pact-body">
                AI-powered legal research platform with comprehensive UAE document coverage. From federal laws to emirate regulations — instant answers with verified citations.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" className="group" asChild>
                <a href="/pricing">
                  Start Research Trial
                  <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="group" asChild>
                <a href="#demo">
                  <Icon name="search" size={20} className="mr-2" />
                  See Legal AI Demo
                </a>
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">50K+</div>
                <div className="text-sm text-muted-foreground">legal documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">5</div>
                <div className="text-sm text-muted-foreground">jurisdictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">24/7</div>
                <div className="text-sm text-muted-foreground">monitoring</div>
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