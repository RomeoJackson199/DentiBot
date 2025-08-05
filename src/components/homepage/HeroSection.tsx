import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Activity, Shield, Clock, Users, Star, ArrowRight, Bot, Sparkles, CheckCircle, Zap, Heart, TrendingUp, Play, Award, Globe } from "lucide-react";

interface HeroSectionProps {
  onBookAppointment: () => void;
  onStartTriage: () => void;
}

export const HeroSection = ({
  onBookAppointment,
  onStartTriage
}: HeroSectionProps) => {
  return (
    <section className="relative mobile-section-lg overflow-hidden">
      {/* Enhanced Background Pattern with better performance */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      
      {/* Enhanced Animated Background Elements - Optimized for performance */}
      <div className="absolute inset-0 hidden sm:block pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-dental-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dental-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-dental-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-dental-info/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "6s" }}></div>
      </div>
      
      {/* Content */}
      <div className="relative mobile-container sm:tablet-container lg:desktop-container">
        <div className="text-center max-w-6xl mx-auto">
          {/* Enhanced AI Badge with better visual hierarchy */}
          <Badge 
            variant="outline" 
            className="mb-6 sm:mb-8 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-glass backdrop-blur-xl border-dental-primary/30 text-dental-primary shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 animate-fade-in touch-target"
          >
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse-soft" />
            <span className="font-semibold text-mobile-sm sm:text-base">Powered by Advanced AI</span>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
            <span className="text-2xs sm:text-xs ml-1 hidden xs:inline">24/7 Available</span>
          </Badge>

          {/* Enhanced Main Headline with better typography */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <h1 className="mobile-heading-lg animate-slide-up">
              <span className="gradient-text">Your Intelligent</span>
              <br />
              <span className="text-mobile-2xl sm:text-3xl lg:text-5xl text-dental-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
                Dental Assistant
              </span>
            </h1>

            {/* Enhanced Subheadline with better readability */}
            <p className="mobile-body sm:text-xl lg:text-2xl text-dental-muted-foreground max-w-4xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: "0.4s" }}>
              Experience the future of dental care with <span className="text-dental-primary font-semibold">AI-powered consultations</span>, 
              smart appointment booking, and personalized treatment recommendations.
            </p>
          </div>

          {/* Enhanced Feature Highlights with better visual design */}
          <div className="mobile-grid-3 mb-8 sm:mb-12 max-w-5xl mx-auto">
            {[
              {
                icon: Bot,
                title: "AI Chat Assistant",
                description: "Get instant answers to dental questions and concerns",
                gradient: "from-blue-500 to-purple-500",
                delay: "0.6s",
                color: "text-blue-500"
              },
              {
                icon: Clock,
                title: "Smart Booking",
                description: "Book appointments intelligently with duration info",
                gradient: "from-green-500 to-blue-500",
                delay: "0.8s",
                color: "text-green-500"
              },
              {
                icon: Activity,
                title: "Emergency Triage",
                description: "Quick assessment for urgent dental situations",
                gradient: "from-orange-500 to-red-500",
                delay: "1.0s",
                color: "text-orange-500"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                variant="feature" 
                hover
                glow
                className="mobile-card-interactive border border-white/10 hover:border-dental-primary/30 transition-all duration-500 group animate-scale-in"
                style={{ animationDelay: feature.delay }}
              >
                <CardContent padding="mobile" className="text-center">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="mobile-heading-sm sm:text-lg lg:text-xl mb-2 sm:mb-3 group-hover:text-dental-primary transition-colors font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mobile-caption sm:text-sm text-dental-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Key Stats with better visual hierarchy */}
          <div className="flex flex-wrap justify-center mobile-gap sm:gap-8 lg:gap-12 mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: "1.2s" }}>
            {[
              { value: "24/7", label: "Available", color: "text-dental-primary", icon: Clock, bg: "bg-dental-primary/10" },
              { value: "98%", label: "Accuracy", color: "text-dental-secondary", icon: TrendingUp, bg: "bg-dental-secondary/10" },
              { value: "3 Min", label: "Avg Response", color: "text-dental-accent", icon: Zap, bg: "bg-dental-accent/10" }
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer touch-feedback">
                <div className={`${stat.bg} w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
                </div>
                <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </div>
                <div className="mobile-caption text-dental-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Enhanced CTA Buttons with better mobile experience */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center items-center mb-12 sm:mb-16 animate-slide-up" style={{ animationDelay: "1.4s" }}>
            <Button 
              variant="gradient"
              size="mobile-lg" 
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold group touch-target shadow-elegant hover:shadow-glow"
              onClick={onBookAppointment}
              icon={<Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />}
              rightIcon={<ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />}
            >
              Get Started Free
            </Button>

            <Button 
              variant="glass-strong"
              size="mobile-lg" 
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold border-dental-primary/30 hover:border-dental-primary/60 touch-target"
              onClick={onStartTriage}
              icon={<Activity className="w-5 h-5 sm:w-6 sm:h-6" />}
            >
              Emergency Assessment
            </Button>
          </div>

          {/* Enhanced Trust Indicators with better visual design */}
          <div className="flex flex-wrap justify-center items-center mobile-gap text-mobile-sm sm:text-sm text-dental-muted-foreground animate-fade-in" style={{ animationDelay: "1.6s" }}>
            {[
              { icon: Shield, text: "HIPAA Compliant", color: "text-green-500" },
              { icon: Heart, text: "Secure & Private", color: "text-red-500" },
              { icon: CheckCircle, text: "No Credit Card", color: "text-blue-500" },
              { icon: Award, text: "Trusted by 10K+", color: "text-yellow-500" }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-2 group hover:text-dental-primary transition-colors cursor-pointer touch-feedback">
                <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} group-hover:scale-110 transition-transform flex-shrink-0`} />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Enhanced Demo Preview */}
          <div className="mt-12 sm:mt-16 animate-fade-in" style={{ animationDelay: "1.8s" }}>
            <Card variant="hero" className="max-w-4xl mx-auto p-6 sm:p-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Play className="w-8 h-8 text-dental-primary animate-pulse-soft" />
                <span className="text-lg font-semibold">See it in action</span>
              </div>
              <div className="bg-gradient-to-r from-dental-primary/20 to-dental-accent/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-dental-muted-foreground">AI Assistant is online</span>
                  <Globe className="w-4 h-4 text-dental-primary" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Floating Elements with better positioning */}
      <div className="absolute top-1/4 left-10 hidden lg:block animate-float">
        <Card variant="glass" className="p-6 border border-white/20 hover:border-dental-primary/30 transition-all duration-300 hover:scale-110">
          <Bot className="w-10 h-10 text-blue-500" />
        </Card>
      </div>
      
      <div className="absolute top-1/3 right-10 hidden lg:block animate-float" style={{ animationDelay: "1s" }}>
        <Card variant="glass" className="p-6 border border-white/20 hover:border-dental-accent/30 transition-all duration-300 hover:scale-110">
          <Sparkles className="w-10 h-10 text-purple-500 animate-pulse-soft" />
        </Card>
      </div>
      
      <div className="absolute bottom-1/4 left-1/4 hidden lg:block animate-float" style={{ animationDelay: "2s" }}>
        <Card variant="glass" className="p-6 border border-white/20 hover:border-dental-secondary/30 transition-all duration-300 hover:scale-110">
          <Stethoscope className="w-10 h-10 text-dental-primary" />
        </Card>
      </div>
      
      <div className="absolute bottom-1/3 right-1/4 hidden lg:block animate-float" style={{ animationDelay: "3s" }}>
        <Card variant="glass" className="p-6 border border-white/20 hover:border-dental-warning/30 transition-all duration-300 hover:scale-110">
          <Heart className="w-10 h-10 text-red-500 animate-pulse-soft" />
        </Card>
      </div>
    </section>
  );
};