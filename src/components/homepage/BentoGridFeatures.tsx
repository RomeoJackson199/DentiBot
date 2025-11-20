import { motion } from "framer-motion";
import {
  Calendar,
  Bell,
  Users,
  Shield,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
  delay?: number;
  gradient?: string;
}

const BentoCard = ({ title, description, icon: Icon, className, delay = 0, gradient }: BentoCardProps) => (
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

      <p className="text-gray-500 leading-relaxed group-hover:text-gray-600">
        {description}
      </p>
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
            Complete Practice Management, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Redefined.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Everything you need to run a modern practice, all in one place.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <BentoCard
            title="Intelligent Calendar"
            description="Drag-and-drop scheduling with automated conflict detection and multi-view support."
            icon={Calendar}
            gradient="bg-blue-600"
            delay={0.1}
          />

          <BentoCard
            title="Automated Recalls"
            description="Bring patients back with smart SMS & email reminders that reduce no-shows by 40%."
            icon={Bell}
            gradient="bg-purple-600"
            delay={0.2}
          />

          <BentoCard
            title="Patient Records (EMR)"
            description="Secure, searchable digital charts with treatment history, files, and notes in one place."
            icon={Users}
            gradient="bg-emerald-600"
            delay={0.3}
          />

          <BentoCard
            title="Bank-Level Security"
            description="Full HIPAA compliance with end-to-end encryption to keep your patient data safe."
            icon={Shield}
            gradient="bg-indigo-600"
            delay={0.4}
          />

          <BentoCard
            title="Billing & Invoicing"
            description="Create professional invoices, accept online payments, and track revenue effortlessly."
            icon={CheckCircle2}
            gradient="bg-orange-600"
            delay={0.5}
          />

          <BentoCard
            title="Review Management"
            description="Automatically request reviews from happy patients to boost your online reputation."
            icon={Sparkles}
            gradient="bg-pink-600"
            delay={0.6}
          />

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
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
