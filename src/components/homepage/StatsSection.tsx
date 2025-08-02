import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  Star, 
  TrendingUp,
  CheckCircle,
  Zap
} from "lucide-react";

export const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      value: "25,000+",
      label: "Patients Served",
      description: "Across 500+ dental practices worldwide",
      color: "text-dental-primary"
    },
    {
      icon: Clock,
      value: "3 Min",
      label: "Average Triage Time",
      description: "70% faster than traditional phone screening",
      color: "text-dental-secondary"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "Patient Satisfaction",
      description: "Based on 10,000+ verified reviews",
      color: "text-yellow-500"
    },
    {
      icon: TrendingUp,
      value: "40%",
      label: "Revenue Increase",
      description: "Average practice growth in first 6 months",
      color: "text-green-600"
    },
    {
      icon: CheckCircle,
      value: "98%",
      label: "Accuracy Rate",
      description: "AI triage accuracy verified by dental professionals",
      color: "text-blue-600"
    },
    {
      icon: Zap,
      value: "24/7",
      label: "Availability",
      description: "Always-on patient support and triage",
      color: "text-dental-accent"
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-6">
            Trusted by Practices Worldwide
          </h2>
          <p className="text-xl text-dental-muted-foreground leading-relaxed">
            Join thousands of dental professionals who have transformed their practice 
            with our AI-powered platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="glass-card border-0 hover:shadow-elegant transition-all duration-300 group"
            >
              <CardContent className="p-8 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>

                {/* Value */}
                <div className="text-4xl sm:text-5xl font-bold mb-2 gradient-text">
                  {stat.value}
                </div>

                {/* Label */}
                <h3 className="text-xl font-semibold mb-3 text-dental-primary">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-dental-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="glass-card inline-block px-8 py-4 rounded-2xl">
            <p className="text-lg text-dental-muted-foreground">
              <span className="font-semibold text-dental-primary">500+ practices</span> can't be wrong. 
              Join the revolution in dental care.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};