import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Shield,
  Sparkles,
  DollarSign,
  CheckCircle,
  Heart,
  Zap
} from "lucide-react";

interface Benefit {
  icon: typeof Calendar;
  title: string;
  description: string;
  gradient: string;
  stat?: string;
}

const ROTATING_BENEFITS: Benefit[] = [
  {
    icon: Clock,
    title: "Save 60% of Your Time",
    description: "Automate scheduling, reminders, and admin tasks. Spend more time with patients, less on paperwork.",
    gradient: "from-blue-500 to-cyan-500",
    stat: "60% Time Saved"
  },
  {
    icon: TrendingUp,
    title: "Reduce No-Shows by 40%",
    description: "Smart AI reminders via SMS and email ensure patients never miss appointments. Increase revenue instantly.",
    gradient: "from-purple-500 to-pink-500",
    stat: "40% Fewer No-Shows"
  },
  {
    icon: Users,
    title: "Manage Unlimited Patients",
    description: "Complete patient records, treatment plans, and history in one organized dashboard. Never lose track again.",
    gradient: "from-green-500 to-emerald-500",
    stat: "100% Organized"
  },
  {
    icon: Shield,
    title: "HIPAA-Compliant Security",
    description: "Enterprise-grade encryption keeps patient data secure. Meet all compliance requirements effortlessly.",
    gradient: "from-indigo-500 to-blue-500",
    stat: "Bank-Level Security"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Predict patient needs, optimize scheduling, and get intelligent recommendations to grow your practice.",
    gradient: "from-orange-500 to-red-500",
    stat: "Smart Analytics"
  },
  {
    icon: DollarSign,
    title: "Increase Revenue by 30%",
    description: "Better scheduling, fewer no-shows, and streamlined billing means more revenue for your practice.",
    gradient: "from-yellow-500 to-orange-500",
    stat: "30% Revenue Boost"
  },
  {
    icon: Heart,
    title: "Improve Patient Satisfaction",
    description: "Modern booking experience, automated reminders, and better communication leads to happier patients.",
    gradient: "from-rose-500 to-pink-500",
    stat: "95% Satisfaction"
  },
  {
    icon: Zap,
    title: "Setup in 5 Minutes",
    description: "No complex installation or training. Get started immediately with our intuitive interface and guided setup.",
    gradient: "from-teal-500 to-cyan-500",
    stat: "5 Minute Setup"
  }
];

export function RotatingBenefitsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ROTATING_BENEFITS.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentBenefit = ROTATING_BENEFITS[currentIndex];
  const Icon = currentBenefit.icon;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 border-white/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Icon */}
              <div className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${currentBenefit.gradient} p-1`}>
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <Icon className={`h-10 w-10 bg-gradient-to-br ${currentBenefit.gradient} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                {currentBenefit.stat && (
                  <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${currentBenefit.gradient} text-white text-sm font-semibold mb-3`}>
                    {currentBenefit.stat}
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {currentBenefit.title}
                </h3>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  {currentBenefit.description}
                </p>
              </div>

              {/* Checkmark */}
              <div className="flex-shrink-0">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {ROTATING_BENEFITS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-gradient-to-r " + ROTATING_BENEFITS[currentIndex].gradient
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to benefit ${index + 1}`}
          />
        ))}
      </div>

      {/* Benefit Counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {ROTATING_BENEFITS.length}
        </span>
      </div>
    </div>
  );
}
