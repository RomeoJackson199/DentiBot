import { motion } from "framer-motion";
import { PhoneMissed, Clock, TrendingDown, BatteryLow } from "lucide-react";
import { Card } from "@/components/ui/card";

const problems = [
  {
    title: "Missed Opportunities",
    description: "Patients calling during lunch breaks, after hours, or when staff is busy with in-office care.",
    icon: PhoneMissed,
    color: "text-red-500",
    bg: "bg-red-50"
  },
  {
    title: "Limited Availability",
    description: "Phone lines only staffed 8-5, but patients need care around their schedules.",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
  {
    title: "Lost Revenue",
    description: "Each unanswered call is a patient who calls your competitor next.",
    icon: TrendingDown,
    color: "text-yellow-600",
    bg: "bg-yellow-50"
  },
  {
    title: "Staff Burnout",
    description: "Your team juggling phones while trying to provide excellent in-person care.",
    icon: BatteryLow,
    color: "text-gray-600",
    bg: "bg-gray-50"
  }
];

export const ProblemSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-red-600 tracking-wide uppercase mb-3"
          >
            The Problem
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
          >
            Every Missed Call is a <span className="text-red-600">Lost Patient</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            In a competitive healthcare landscape, availability is everything. Traditional phone lines are failing your practice.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <Card className="h-full p-8 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/50 backdrop-blur-sm ring-1 ring-gray-100">
                <div className={`w-12 h-12 rounded-2xl ${problem.bg} ${problem.color} flex items-center justify-center mb-6`}>
                  <problem.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h4>
                <p className="text-gray-600 leading-relaxed">{problem.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
