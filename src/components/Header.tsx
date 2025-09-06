import { Button } from "@/components/ui/button"

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-brand-primary font-pact-display">BrandIQ</h1>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#insights" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Insights
              </a>
              <a href="#pricing" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Sign In
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