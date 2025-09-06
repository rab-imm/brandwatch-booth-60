import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { DashboardPreview } from "@/components/DashboardPreview"
import { InteractiveDashboard } from "@/components/InteractiveDashboard"
import { ProcessFlow } from "@/components/ProcessFlow"
import { Features } from "@/components/Features"
import { CallToAction } from "@/components/CallToAction"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <DashboardPreview />
        <InteractiveDashboard />
        <ProcessFlow />
        <Features />
        <CallToAction />
      </main>
      
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-brand-primary mb-4">BrandIQ</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Intelligent brand monitoring and competitive analysis platform 
                trusted by leading brands worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
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
                  Integrations
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  API
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-brand-primary mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Status Page
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 BrandIQ. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-muted-foreground">Built with Lovable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;