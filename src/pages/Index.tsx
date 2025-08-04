import { HeroSection } from "@/components/homepage/HeroSection";
import { FeatureCards } from "@/components/homepage/FeatureCards";
import { StatsSection } from "@/components/homepage/StatsSection";
import { Footer } from "@/components/homepage/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection onBookAppointment={() => {}} onStartTriage={() => {}} />
      <FeatureCards />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;