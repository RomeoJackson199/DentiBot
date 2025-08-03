import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Activity, Shield, Clock, Users, Star, ArrowRight } from "lucide-react";
interface HeroSectionProps {
  onBookAppointment: () => void;
  onStartTriage: () => void;
}
export const HeroSection = ({
  onBookAppointment,
  onStartTriage
}: HeroSectionProps) => {
  return <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          {/* Trust Badge */}
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm border-dental-primary/30 text-dental-primary">
            <Shield className="w-4 h-4 mr-2" />
            HIPAA Compliant • Trusted by 500+ Practices
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold gradient-text mb-6 leading-tight">
            AI-Powered Emergency Triage
            <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2 text-dental-muted-foreground">
              for Modern Dental Practices
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-dental-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Reduce emergency call volume by 70% with intelligent symptom assessment, 
            smart scheduling, and automated patient guidance.
          </p>

          {/* Key Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-10">
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-primary group-hover:scale-110 transition-transform duration-300">3 Min</div>
              <div className="text-sm text-dental-muted-foreground">Avg. Triage Time</div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-secondary group-hover:scale-110 transition-transform duration-300">70%</div>
              <div className="text-sm text-dental-muted-foreground">Call Reduction</div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-accent group-hover:scale-110 transition-transform duration-300">98%</div>
              <div className="text-sm text-dental-muted-foreground">Accuracy Rate</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-destructive hover:bg-destructive/90 text-white px-8 py-4 text-lg font-semibold shadow-elegant group transition-all duration-300 hover:scale-105" onClick={onStartTriage}>
              <Activity className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Start Emergency Triage
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary px-8 py-4 text-lg font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-300" onClick={onBookAppointment}>
              <Clock className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
          </div>

          {/* Social Proof */}
          
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 hidden lg:block animate-float">
        <div className="glass-card p-4 rounded-2xl">
          <Activity className="w-8 h-8 text-dental-primary" />
        </div>
      </div>
      <div className="absolute top-1/3 right-10 hidden lg:block animate-float" style={{
      animationDelay: "1s"
    }}>
        <div className="glass-card p-4 rounded-2xl">
          <Clock className="w-8 h-8 text-dental-secondary" />
        </div>
      </div>
      <div className="absolute bottom-1/4 left-1/4 hidden lg:block animate-float" style={{
      animationDelay: "2s"
    }}>
        <div className="glass-card p-4 rounded-2xl">
          <Stethoscope className="w-8 h-8 text-dental-accent" />
        </div>
      </div>
    </section>;
};