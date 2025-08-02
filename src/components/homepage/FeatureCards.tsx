import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, BarChart3, MessageSquare, Calendar, Shield, Smartphone, Zap, Heart } from "lucide-react";
export const FeatureCards = () => {
  const features = [{
    icon: Brain,
    title: "AI Emergency Triage",
    description: "Intelligent symptom assessment in 3 streamlined questions. Get accurate urgency ratings instantly.",
    badge: "Most Popular",
    color: "text-dental-primary",
    bgColor: "bg-dental-primary/10"
  }, {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatic appointment matching based on urgency. Fill gaps intelligently and reduce no-shows.",
    badge: "Time Saver",
    color: "text-dental-secondary",
    bgColor: "bg-dental-secondary/10"
  }, {
    icon: BarChart3,
    title: "Practice Analytics",
    description: "Real-time insights on patient flow, revenue optimization, and staff productivity metrics.",
    badge: "Data Driven",
    color: "text-dental-accent",
    bgColor: "bg-dental-accent/10"
  }, {
    icon: MessageSquare,
    title: "24/7 AI Assistant",
    description: "Always-on patient support with multilingual capabilities and HIPAA-compliant communication.",
    badge: "Always On",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10"
  }, {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Perfect experience on any device. PWA technology for native app-like performance.",
    badge: "Mobile Ready",
    color: "text-green-600",
    bgColor: "bg-green-600/10"
  }, {
    icon: Shield,
    title: "Enterprise Security",
    description: "HIPAA/GDPR compliant with end-to-end encryption, audit logs, and role-based access control.",
    badge: "Secure",
    color: "text-red-600",
    bgColor: "bg-red-600/10"
  }];
  return <section className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm border-dental-primary/30 text-dental-primary">
            <Zap className="w-4 h-4 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-6">
            Everything You Need to Transform Your Practice
          </h2>
          <p className="text-xl text-dental-muted-foreground leading-relaxed">
            From emergency triage to practice management, our AI-powered platform 
            streamlines every aspect of patient care.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => <Card key={index} className="glass-card hover:shadow-elegant transition-all duration-300 group cursor-pointer border-0">
              <CardContent className="p-8">
                {/* Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-white/20 text-dental-primary border-0">
                    {feature.badge}
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-dental-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-dental-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="mt-6 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm text-dental-primary font-medium">
                    Learn more →
                  </span>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          
        </div>
      </div>
    </section>;
};