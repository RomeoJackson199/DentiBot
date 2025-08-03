import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, BarChart3, MessageSquare, Calendar, Shield, Smartphone, Zap, Heart, Bot, Sparkles, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
export const FeatureCards = () => {
  const features = [{
    icon: Bot,
    title: "AI Chat Assistant",
    description: "Get instant answers to dental questions with our intelligent AI assistant. Available 24/7 for all your dental concerns.",
    badge: "Most Popular",
    color: "text-blue-500",
    bgColor: "bg-gradient-to-r from-blue-500 to-purple-500"
  }, {
    icon: Calendar,
    title: "Smart Appointment Booking",
    description: "Book appointments intelligently with duration information and automated scheduling based on your preferences.",
    badge: "Time Saver",
    color: "text-green-500",
    bgColor: "bg-gradient-to-r from-green-500 to-blue-500"
  }, {
    icon: Heart,
    title: "Health Records Management",
    description: "Keep track of your dental health with comprehensive medical history and treatment plan management.",
    badge: "Health Focused",
    color: "text-red-500",
    bgColor: "bg-gradient-to-r from-red-500 to-pink-500"
  }, {
    icon: MessageSquare,
    title: "Family Care Support",
    description: "Book appointments for your entire family. Manage multiple profiles with ease and convenience.",
    badge: "Family Friendly",
    color: "text-purple-500",
    bgColor: "bg-gradient-to-r from-purple-500 to-indigo-500"
  }, {
    icon: Smartphone,
    title: "Mobile-First Experience",
    description: "Perfect experience on any device with PWA technology for native app-like performance and offline access.",
    badge: "Mobile Ready",
    color: "text-orange-500",
    bgColor: "bg-gradient-to-r from-orange-500 to-red-500"
  }, {
    icon: Shield,
    title: "Privacy & Security",
    description: "HIPAA/GDPR compliant with end-to-end encryption and secure data handling for your peace of mind.",
    badge: "Secure",
    color: "text-indigo-500",
    bgColor: "bg-gradient-to-r from-indigo-500 to-purple-500"
  }];
  return <section className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-500/30 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4 mr-2" />
            Advanced Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-6">
            Everything You Need for Better Dental Care
          </h2>
          <p className="text-xl text-dental-muted-foreground leading-relaxed">
            Experience the future of dental care with AI-powered features designed to make your dental journey 
            smoother, smarter, and more convenient.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => <Card key={index} className="glass-card hover:shadow-elegant transition-all duration-300 group cursor-pointer border border-white/10 hover:border-dental-primary/30">
              <CardContent className="p-8">
                {/* Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-white/20 text-dental-primary border-0">
                    {feature.badge}
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-4 group-hover:text-dental-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-dental-muted-foreground leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Feature Benefits */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Available 24/7</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Instant responses</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Secure & private</span>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="mt-6 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link
                    to={`/features/${index}`}
                    className="text-sm text-dental-primary font-medium hover:underline"
                  >
                    Learn more →
                  </Link>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="glass-card p-8 rounded-3xl border border-white/10 max-w-2xl mx-auto">
            <Users className="w-12 h-12 text-dental-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Join Thousands of Happy Patients</h3>
            <p className="text-dental-muted-foreground mb-6">
              Start your journey to better dental health today. It's free to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
              >
                Get Started Free
              </Link>
              <Link
                to="/emergency-triage"
                className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-dental-primary font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                Emergency Assessment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>;
};