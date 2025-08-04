import { HeroSection } from "@/components/homepage/HeroSection";
import { SimpleHeader } from "@/components/homepage/SimpleHeader";
import { FeatureCards } from "@/components/homepage/FeatureCards";
import { StatsSection } from "@/components/homepage/StatsSection";
import { Footer } from "@/components/homepage/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader />
      <main className="flex-1">
        <HeroSection 
          onBookAppointment={() => window.location.href = '/auth'} 
          onStartTriage={() => window.location.href = '/auth'} 
        />
        <FeatureCards />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;