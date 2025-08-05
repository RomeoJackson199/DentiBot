import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Calendar, 
  MessageSquare, 
  Shield, 
  Zap, 
  Users,
  Heart,
  Clock,
  Phone,
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react";

export function ModernFeatureCards() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Triage",
      description: "Advanced AI analyzes symptoms and prioritizes urgency for optimal care",
      color: "text-dental-primary",
      bgColor: "bg-dental-primary/10",
      badge: "AI Technology",
      benefits: ["24/7 Assessment", "Instant Results", "High Accuracy"]
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Intelligent appointment booking with real-time availability and preferences",
      color: "text-dental-secondary", 
      bgColor: "bg-dental-secondary/10",
      badge: "Automation",
      benefits: ["Real-time Sync", "Auto-reminders", "Flexible Booking"]
    },
    {
      icon: MessageSquare,
      title: "Seamless Communication",
      description: "Direct patient-dentist messaging with secure, HIPAA-compliant channels",
      color: "text-dental-accent",
      bgColor: "bg-dental-accent/10", 
      badge: "HIPAA Secure",
      benefits: ["Instant Messaging", "File Sharing", "Video Calls"]
    },
    {
      icon: Shield,
      title: "Complete Privacy",
      description: "Bank-level encryption ensures your medical data stays secure and private",
      color: "text-dental-success",
      bgColor: "bg-dental-success/10",
      badge: "Enterprise Security",
      benefits: ["End-to-end Encryption", "GDPR Compliant", "Audit Trails"]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed with instant responses and minimal wait times",
      color: "text-dental-warning",
      bgColor: "bg-dental-warning/10",
      badge: "High Performance", 
      benefits: ["< 1s Response", "99.9% Uptime", "Global CDN"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Dental teams can coordinate care with shared patient insights",
      color: "text-dental-info",
      bgColor: "bg-dental-info/10",
      badge: "Team Tools",
      benefits: ["Shared Dashboard", "Role Permissions", "Care Coordination"]
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 hero-pattern opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <Badge variant="gradient" size="lg" className="mx-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            Platform Features
          </Badge>
          
          <h2 className="text-4xl sm:text-5xl font-bold">
            <span className="gradient-text">Everything You Need</span>
            <br />
            <span className="text-foreground">For Modern Dental Care</span>
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our comprehensive platform combines cutting-edge AI with intuitive design 
            to revolutionize how dental practices operate and patients receive care.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="elevated"
              className="group hover:scale-105 transition-all duration-500 overflow-hidden border-0 bg-card/80 backdrop-blur-sm"
              style={{ 
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Card Header with Icon */}
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <Badge variant="outline" size="sm" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                
                <CardTitle className="text-xl mb-2 group-hover:gradient-text transition-all duration-300">
                  {feature.title}
                </CardTitle>
                
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>

              {/* Benefits List */}
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  {feature.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${feature.bgColor} border-2 ${feature.color.replace('text', 'border')}`} />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Learn More Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full group-hover:bg-accent/50 transition-colors"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold text-foreground">
              Ready to Experience the Future?
            </h3>
            <p className="text-muted-foreground">
              Join thousands of dental professionals who have already transformed their practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg">
                <Calendar className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                <Phone className="h-5 w-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}