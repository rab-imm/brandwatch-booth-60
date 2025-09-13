import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { ProblemSection } from "@/components/ProblemSection"
import { ChatPreview } from "@/components/ChatPreview"
import { ThreeModePipeline } from "@/components/ThreeModePipeline"
import { HowItWorks } from "@/components/HowItWorks"
import { Features } from "@/components/Features"
import { UseCases } from "@/components/UseCases"
import { LegalDisclaimers } from "@/components/LegalDisclaimers"
import { CallToAction } from "@/components/CallToAction"
import { Footer } from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ChatPreview />
        <ThreeModePipeline />
        <ProblemSection />
        <Features />
        <UseCases />
        <LegalDisclaimers />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;