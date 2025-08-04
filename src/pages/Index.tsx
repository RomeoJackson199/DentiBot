import { HeroSection } from "@/components/homepage/HeroSection";
import { FeatureCards } from "@/components/homepage/FeatureCards";
import { StatsSection } from "@/components/homepage/StatsSection";
import { Footer } from "@/components/homepage/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection 
        onBookAppointment={() => window.location.href = '/auth'} 
        onStartTriage={() => window.location.href = '/auth'} 
      />
      <FeatureCards />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;