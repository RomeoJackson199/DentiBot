import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTiltEffect } from "@/hooks/useTiltEffect";
import { Brain, Clock, BarChart3, MessageSquare, Calendar, Shield, Smartphone, Zap, Heart, Bot, Sparkles, Users, CheckCircle, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
  const { ref, tiltStyle, onMouseMove, onMouseLeave } = useTiltEffect({
    maxTilt: 8,
    scale: 1.05,
  });

  return (
    <Card 
      ref={ref}
      variant="glass" 
      hover
      glow
      className="mobile-card-interactive border border-white/10 hover:border-dental-primary/30 transition-all duration-500 group animate-scale-in cursor-pointer"
      style={{ 
        animationDelay: feature.delay,
        ...tiltStyle,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <CardContent padding="none" className="p-4 sm:p-6 lg:p-8">
        <div style={{ transform: 'translateZ(50px)' }}>
          {/* Enhanced Badge and Icon - Mobile sizes */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
              <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <Badge 
              variant="secondary" 
              className="text-2xs sm:text-xs bg-gradient-glass text-dental-primary border-dental-primary/20 shadow-soft"
            >
              {feature.badge}
            </Badge>
          </div>

          {/* Enhanced Content - Mobile typography */}
          <h3 className="mobile-heading-sm sm:text-xl mb-3 sm:mb-4 group-hover:text-dental-primary transition-colors">
            {feature.title}
          </h3>
          <p className="mobile-body text-dental-muted-foreground mb-4 sm:mb-6">
            {feature.description}
          </p>
        </div>

        <div style={{ transform: 'translateZ(30px)' }}>
          {/* Enhanced Feature Benefits - Mobile layout */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mobile-caption group-hover:text-dental-primary transition-colors">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Available 24/7</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 mobile-caption group-hover:text-dental-primary transition-colors">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Instant responses</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 mobile-caption group-hover:text-dental-primary transition-colors">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Secure & private</span>
            </div>
          </div>

          {/* Enhanced Hover Effect - Touch friendly */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              to={`/features/${index}`}
              className="inline-flex items-center mobile-caption sm:text-sm text-dental-primary font-medium hover:underline group/link touch-feedback"
            >
              Learn more 
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const FeatureCards = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Chat Assistant",
      description: "Get instant answers to dental questions with our intelligent AI assistant. Available 24/7 for all your dental concerns.",
      badge: "Most Popular",
      color: "text-blue-500",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-500",
      delay: "0.2s"
    }, 
    {
      icon: Calendar,
      title: "Smart Appointment Booking",
      description: "Book appointments intelligently with duration information and automated scheduling based on your preferences.",
      badge: "Time Saver",
      color: "text-green-500",
      bgColor: "bg-gradient-to-r from-green-500 to-blue-500",
      delay: "0.4s"
    }, 
    {
      icon: Heart,
      title: "Health Records Management",
      description: "Keep track of your dental health with comprehensive medical history and treatment plan management.",
      badge: "Health Focused",
      color: "text-red-500",
      bgColor: "bg-gradient-to-r from-red-500 to-pink-500",
      delay: "0.6s"
    }, 
    {
      icon: MessageSquare,
      title: "Family Care Support",
      description: "Book appointments for your entire family. Manage multiple profiles with ease and convenience.",
      badge: "Family Friendly",
      color: "text-purple-500",
      bgColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
      delay: "0.8s"
    }, 
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "Perfect experience on any device with PWA technology for native app-like performance and offline access.",
      badge: "Mobile Ready",
      color: "text-orange-500",
      bgColor: "bg-gradient-to-r from-orange-500 to-red-500",
      delay: "1.0s"
    }, 
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "HIPAA/GDPR compliant with end-to-end encryption and secure data handling for your peace of mind.",
      badge: "Secure",
      color: "text-indigo-500",
      bgColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
      delay: "1.2s"
    }
  ];

  return (
    <section className="mobile-section">
      <div className="mobile-container sm:tablet-container lg:desktop-container">
        {/* Enhanced Section Header - Mobile optimized */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <Badge 
            variant="outline" 
            className="mb-4 sm:mb-6 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-glass backdrop-blur-xl border-dental-primary/30 text-dental-primary shadow-elegant hover:shadow-glow hover:scale-105 transition-all duration-300 animate-fade-in touch-target"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse-soft" />
            <span className="font-semibold text-mobile-sm sm:text-base">Advanced Features</span>
          </Badge>
          
          <h2 className="mobile-heading-lg animate-slide-up mb-4 sm:mb-6">
            Everything You Need for Better Dental Care
          </h2>
          
          <p className="mobile-body sm:text-xl text-dental-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Experience the future of dental care with AI-powered features designed to make your dental journey 
            smoother, smarter, and more convenient.
          </p>
        </div>

        {/* Enhanced Feature Grid - Mobile responsive */}
        <div className="mobile-grid-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Enhanced Bottom CTA - Mobile optimized */}
        <div className="text-center mt-16 sm:mt-20 animate-fade-in" style={{ animationDelay: "1.4s" }}>
          <Card 
            variant="glass-strong" 
            className="p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/20 max-w-3xl mx-auto hover:shadow-glow transition-all duration-500"
          >
            <CardContent padding="none" className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-elegant">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h3 className="mobile-heading-md sm:text-3xl gradient-text mb-3 sm:mb-4">
                Join Thousands of Happy Patients
              </h3>
              
              <p className="mobile-body sm:text-lg text-dental-muted-foreground mb-6 sm:mb-8">
                Start your journey to better dental health today. It's free to get started and takes less than 2 minutes!
              </p>
              
              {/* Enhanced Rating Display - Mobile responsive */}
              <div className="flex flex-col xs:flex-row items-center justify-center gap-2 mb-6 sm:mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="mobile-caption sm:text-sm text-dental-muted-foreground font-medium">4.9/5 from 2,000+ reviews</span>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 font-semibold group touch-target"
                  rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />}
                >
                  Get Started Free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};