import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Calendar, 
  Shield, 
  Zap, 
  Users, 
  Brain,
  Heart,
  Star,
  ArrowRight,
  Play
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ModernHeroSectionProps {
  onBookAppointment: () => void;
  onStartTriage: () => void;
}

export function ModernHeroSection({ onBookAppointment, onStartTriage }: ModernHeroSectionProps) {
  const { t } = useLanguage();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const features = [
    { icon: Brain, title: "AI-Powered", description: "Smart dental assistance" },
    { icon: Shield, title: "Secure", description: "HIPAA compliant platform" },
    { icon: Zap, title: "Fast", description: "Instant triage & booking" },
    { icon: Users, title: "Connected", description: "Seamless communication" }
  ];

  const stats = [
    { value: "10k+", label: "Happy Patients" },
    { value: "500+", label: "Dental Professionals" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "24/7", label: "AI Support" }
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/50 to-background/90" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float" style={{ animationDelay: "0s" }}>
          <Card variant="glass" size="sm" className="p-3 backdrop-blur-xl">
            <Heart className="h-6 w-6 text-dental-primary" />
          </Card>
        </div>
        
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: "2s" }}>
          <Card variant="glass" size="sm" className="p-3 backdrop-blur-xl">
            <Shield className="h-6 w-6 text-dental-secondary" />
          </Card>
        </div>
        
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: "4s" }}>
          <Card variant="glass" size="sm" className="p-3 backdrop-blur-xl">
            <Zap className="h-6 w-6 text-dental-accent" />
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          
          {/* AI Badge */}
          <div className="animate-fade-in">
            <Badge variant="secondary" className="bg-gradient-primary text-white px-6 py-2 text-sm rounded-full shadow-glow">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by Advanced AI
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="gradient-text">Smart Dental Care</span>
              <br />
              <span className="text-foreground">Made Simple</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the future of dental care with AI-powered triage, 
              smart scheduling, and seamless patient-dentist communication.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                variant="glass-strong" 
                className="p-4 hover:scale-105 transition-all duration-300 group"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <feature.icon className="h-8 w-8 text-dental-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.8s" }}>
            <Button
              variant="gradient"
              size="xl"
              onClick={onBookAppointment}
              className="group min-w-[200px]"
            >
              <Calendar className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Book Appointment
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="xl"
              onClick={onStartTriage}
              className="group min-w-[200px] border-dental-primary/30 hover:bg-dental-primary/5"
            >
              <Shield className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Emergency Triage
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 animate-fade-in" style={{ animationDelay: "1s" }}>
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Demo Video Placeholder */}
          <div className="relative max-w-4xl mx-auto animate-scale-in" style={{ animationDelay: "1.2s" }}>
            <Card variant="elevated" className="relative overflow-hidden group">
              <div className="aspect-video bg-gradient-to-br from-dental-primary/20 to-dental-accent/20 flex items-center justify-center">
                {!isVideoPlaying ? (
                  <Button
                    variant="glass"
                    size="lg"
                    onClick={() => setIsVideoPlaying(true)}
                    className="group hover:scale-110 transition-all duration-300"
                  >
                    <Play className="h-8 w-8 mr-2 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </Button>
                ) : (
                  <div className="text-white text-lg font-medium">
                    Demo Video Playing...
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 animate-fade-in" style={{ animationDelay: "1.4s" }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-dental-success" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-dental-warning" />
              4.9/5 Rating
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-dental-info" />
              Trusted by 500+ Dentists
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}