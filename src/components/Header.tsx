import { Button } from "@/components/ui/button"

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-brand-primary font-pact-display">CreateAI</h1>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#use-cases" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </a>
              <a href="#about" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#resources" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Resources
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Book a Demo
            </Button>
            <Button variant="premium" size="sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}