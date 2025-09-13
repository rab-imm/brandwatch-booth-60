import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { ProblemSection } from "@/components/ProblemSection"

import { ThreeModePipeline } from "@/components/ThreeModePipeline"
import { HowItWorks } from "@/components/HowItWorks"
import { Features } from "@/components/Features"
import { UseCases } from "@/components/UseCases"

import { CallToAction } from "@/components/CallToAction"
import { Footer } from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <ThreeModePipeline />
        <HowItWorks />
        <Features />
        <UseCases />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;