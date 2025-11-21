import { motion } from "framer-motion";
import {
  Bot,
  Zap,
  Clock,
  Activity,
  ClipboardList,
  LayoutDashboard,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
  delay?: number;
  gradient?: string;
  children?: React.ReactNode;
}

const BentoCard = ({ title, description, icon: Icon, className, delay = 0, gradient, children }: BentoCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "group relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
      "bg-white border border-gray-100 shadow-sm",
      className
    )}
  >
    <div className={cn(
      "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
      gradient || "bg-gradient-to-br from-blue-600 to-purple-600"
    )} />

    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-white/80 group-hover:scale-110 transition-all duration-300 shadow-sm text-gray-900">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
        {title}
      </h3>

      <p className="text-gray-500 leading-relaxed group-hover:text-gray-600 mb-4">
        {description}
      </p>

      {children}
    </div>
  </motion.div>
);

export const BentoGridFeatures = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
          >
            Caberu Answers Every Call, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Books Every Appointment
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* AI Phone Reception - Full Width */}
          <BentoCard
            title="AI Phone Reception"
            description="Natural, human-like conversation that answers instantly - no robotic menus or hold music."
            icon={Bot}
            className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 border-blue-100"
            gradient="bg-gradient-to-r from-blue-600 to-purple-600"
            delay={0}
          >
             {/* Decorative sub-features or visualization could go here if needed, but simple text is requested */}
          </BentoCard>

          {/* Real-Time Booking */}
          <BentoCard
            title="Real-Time Booking"
            description="Books appointments with your actual availability in milliseconds, while the patient is on the line."
            icon={Zap}
            gradient="bg-blue-600"
            delay={0.1}
          />

          {/* 24/7 Availability */}
          <BentoCard
            title="24/7 Availability"
            description="Patients can call anytime - early morning, late evening, weekends - and get immediate service."
            icon={Clock}
            gradient="bg-purple-600"
            delay={0.2}
          />

          {/* Smart Triage */}
          <BentoCard
            title="Smart Triage"
            description="Emergency cases identified and prioritized appropriately."
            icon={Activity}
            gradient="bg-red-600"
            delay={0.3}
          />

          {/* Patient Intake */}
          <BentoCard
            title="Patient Intake"
            description="Conversational collection of patient information before they arrive."
            icon={ClipboardList}
            gradient="bg-emerald-600"
            delay={0.4}
          />

          {/* Complete Management */}
          <BentoCard
            title="Complete Management"
            description="Full practice dashboard, patient portal, payments, and analytics included."
            icon={LayoutDashboard}
            gradient="bg-orange-600"
            delay={0.5}
            className="col-span-1 md:col-span-2 lg:col-span-2"
          />
          {/* Note: Adjusted span for aesthetic balance, 5 cards + 1 full width + 1 double width = 3+1+1+1+1+2 = 9 slots.
             Grid is 3 columns.
             Row 1: AI Reception (3 cols)
             Row 2: Booking, 24/7, Triage (3 cols)
             Row 3: Intake (1 col), Complete Mgmt (2 cols)
             Total fit.
           */}

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-500 to-gray-300 tracking-tight animate-pulse">
            And so much more...
          </p>
        </motion.div>
      </div>
    </section>
  );
};
