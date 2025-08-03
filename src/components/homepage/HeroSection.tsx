import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Activity, Shield, Clock, Users, Star, ArrowRight, Bot, Sparkles, CheckCircle } from "lucide-react";
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
        <div className="text-center max-w-6xl mx-auto">
          {/* AI Badge */}
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-500/30 text-blue-600 dark:text-blue-400">
            <Bot className="w-4 h-4 mr-2" />
            Powered by Advanced AI • 24/7 Available
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold gradient-text mb-6 leading-tight">
            Your Intelligent
            <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2 text-dental-muted-foreground">
              Dental Assistant
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-dental-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Experience the future of dental care with AI-powered consultations, 
            smart appointment booking, and personalized treatment recommendations.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-dental-primary/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Chat Assistant</h3>
              <p className="text-sm text-dental-muted-foreground">Get instant answers to dental questions and concerns</p>
            </div>
            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-dental-primary/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Booking</h3>
              <p className="text-sm text-dental-muted-foreground">Book appointments intelligently with duration info</p>
            </div>
            <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-dental-primary/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Emergency Triage</h3>
              <p className="text-sm text-dental-muted-foreground">Quick assessment for urgent dental situations</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-10">
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-primary group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-sm text-dental-muted-foreground">Available</div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-secondary group-hover:scale-110 transition-transform duration-300">98%</div>
              <div className="text-sm text-dental-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center group">
              <div className="text-2xl sm:text-3xl font-bold text-dental-accent group-hover:scale-110 transition-transform duration-300">3 Min</div>
              <div className="text-sm text-dental-muted-foreground">Avg Response</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 text-lg font-semibold shadow-elegant group transition-all duration-300 hover:scale-105" onClick={onBookAppointment}>
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary px-8 py-4 text-lg font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-300" onClick={onStartTriage}>
              <Activity className="w-5 h-5 mr-2" />
              Emergency Assessment
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-dental-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 hidden lg:block animate-float">
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <Bot className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="absolute top-1/3 right-10 hidden lg:block animate-float" style={{
      animationDelay: "1s"
    }}>
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
      </div>
      <div className="absolute bottom-1/4 left-1/4 hidden lg:block animate-float" style={{
      animationDelay: "2s"
    }}>
        <div className="glass-card p-4 rounded-2xl border border-white/10">
          <Stethoscope className="w-8 h-8 text-dental-primary" />
        </div>
      </div>
    </section>;
};