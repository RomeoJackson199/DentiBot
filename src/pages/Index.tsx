import { Header } from "@/components/homepage/Header";
import { HeroSection } from "@/components/homepage/HeroSection";
import { FeatureCards } from "@/components/homepage/FeatureCards";
import { StatsSection } from "@/components/homepage/StatsSection";
import { Footer } from "@/components/homepage/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-primary/5 to-dental-accent/10">
      <Header user={null} />
      <main>
        <HeroSection 
          onBookAppointment={() => {}}
          onStartTriage={() => {}}
        />
        <FeatureCards />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;