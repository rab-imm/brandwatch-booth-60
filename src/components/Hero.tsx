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
                Stop Producing Content.
                <span className="block text-brand-accent">Start Manufacturing It.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg font-pact-body">
                The AI-native content factory with strategy built in. From brief to campaign in minutes — intelligence + control.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" className="group" asChild>
                <a href="/pricing">
                  Start Free Trial
                  <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="group" asChild>
                <a href="#demo">
                  <Icon name="play" size={20} className="mr-2" />
                  Watch 3-Min Demo
                </a>
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">500+</div>
                <div className="text-sm text-muted-foreground">agencies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">1M+</div>
                <div className="text-sm text-muted-foreground">assets created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">uptime</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-dashboard">
              <img 
                src={heroImage} 
                alt="AI content factory dashboard showing campaign generation" 
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