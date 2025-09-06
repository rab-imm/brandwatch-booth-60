import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { ProblemSection } from "@/components/ProblemSection"
import { IntelligenceLayer } from "@/components/IntelligenceLayer"
import { ThreeModePipeline } from "@/components/ThreeModePipeline"
import { Features } from "@/components/Features"
import { CallToAction } from "@/components/CallToAction"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <IntelligenceLayer />
        <ThreeModePipeline />
        <Features />
        <CallToAction />
      </main>
      
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-brand-primary mb-4">CreateAI</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                AI-native content factory trusted by 500+ agencies worldwide. 
                Built for agencies, by agency people.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-brand-primary mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Use Cases
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Integrations
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-brand-primary mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  API Docs
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Status Page
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              CreateAI © 2025 • Built for agencies, by agency people • SOC 2 Type II Certified
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-muted-foreground">Newsletter: Get weekly AI insights</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;