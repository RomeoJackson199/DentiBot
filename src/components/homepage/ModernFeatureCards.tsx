import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTiltEffect } from "@/hooks/useTiltEffect";
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

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const { ref, tiltStyle, onMouseMove, onMouseLeave } = useTiltEffect({
    maxTilt: 8,
    scale: 1.05,
  });

  return (
    <Card
      ref={ref}
      variant="elevated"
      className="group overflow-hidden border-0 bg-card/80 backdrop-blur-sm cursor-pointer"
      style={{ 
        animationDelay: `${index * 0.1}s`,
        ...tiltStyle,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Card Header with Icon */}
      <CardHeader className="relative pb-4" style={{ transform: 'translateZ(50px)' }}>
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
      <CardContent className="pt-0" style={{ transform: 'translateZ(30px)' }}>
        <div className="space-y-3 mb-6">
          {feature.benefits.map((benefit: string) => (
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
  );
}

export function ModernFeatureCards() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Assistant",
      description: "Advanced AI helps you manage tasks and interact with customers intelligently",
      color: "text-dental-primary",
      bgColor: "bg-dental-primary/10",
      badge: "AI Technology",
      benefits: ["24/7 Availability", "Instant Responses", "Smart Automation"]
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
      description: "Direct business-client messaging with secure, encrypted channels",
      color: "text-dental-accent",
      bgColor: "bg-dental-accent/10", 
      badge: "Secure Messaging",
      benefits: ["Instant Messaging", "File Sharing", "Video Calls"]
    },
    {
      icon: Shield,
      title: "Complete Privacy",
      description: "Bank-level encryption ensures your business data stays secure and private",
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
      description: "Teams can coordinate work with shared insights and dashboards",
      color: "text-dental-info",
      bgColor: "bg-dental-info/10",
      badge: "Team Tools",
      benefits: ["Shared Dashboard", "Role Permissions", "Task Management"]
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
            <span className="text-foreground">For Modern Business Management</span>
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our comprehensive platform combines cutting-edge AI with intuitive design 
            to revolutionize how businesses operate and serve their clients.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold text-foreground">
              Ready to Experience the Future?
            </h3>
            <p className="text-muted-foreground">
              Join thousands of business professionals who have already transformed their operations.
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