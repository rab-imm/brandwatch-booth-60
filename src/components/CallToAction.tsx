import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"

export const CallToAction = () => {
  const benefits = [
    "No credit card required",
    "Full access", 
    "Cancel anytime"
  ]

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-12 bg-gradient-accent text-white relative overflow-hidden shadow-dashboard">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]" />
          </div>
          
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight font-pact-display tracking-tight">
                Ready to 10x Your
                <span className="block">Content Output?</span>
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Join 500+ agencies already using CreateAI to ship more, stress less, and actually leave on time.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-brand-primary hover:bg-white/90 font-semibold group"
              >
                Start 14-Day Free Trial
                <Icon name="arrow-right" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline-contrast" 
                size="lg"
              >
                Book a Demo
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Icon name="check" className="h-5 w-5 text-green-400" />
                  <span className="text-sm opacity-90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}