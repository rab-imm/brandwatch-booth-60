import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { ProblemSection } from "@/components/ProblemSection"
import { IntelligenceLayer } from "@/components/IntelligenceLayer"
import { ThreeModePipeline } from "@/components/ThreeModePipeline"
import { HowItWorks } from "@/components/HowItWorks"
import { Features } from "@/components/Features"
import { UseCases } from "@/components/UseCases"
import { SocialProof } from "@/components/SocialProof"
import { CallToAction } from "@/components/CallToAction"
import { Footer } from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <IntelligenceLayer />
        <ThreeModePipeline />
        <HowItWorks />
        <Features />
        <UseCases />
        <SocialProof />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;