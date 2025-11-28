import { motion } from "framer-motion";
import { PhoneMissed, Clock, TrendingDown, BatteryLow } from "lucide-react";
import { Card } from "@/components/ui/card";

const problems = [
  {
    title: "45% of Calls Go Unanswered",
    description: "Average dental practice misses 15-20 calls per day during peak hours, lunch breaks, or when staff is with patients.",
    stat: "45%",
    icon: PhoneMissed,
    color: "text-red-500",
    bg: "bg-red-50"
  },
  {
    title: "70% Call Outside Business Hours",
    description: "Patients try to book after 5pm or on weekends when your phones aren't staffed - and call competitors instead.",
    stat: "70%",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
  {
    title: "$10K+ Lost Revenue Monthly",
    description: "Each missed call averages $200 in lost appointment value. 50 missed calls = $10,000 in revenue walking out the door.",
    stat: "$10K+",
    icon: TrendingDown,
    color: "text-yellow-600",
    bg: "bg-yellow-50"
  },
  {
    title: "20+ Hours Per Week on Phones",
    description: "Your staff spends half their time answering calls instead of providing in-office patient care and building relationships.",
    stat: "20hrs",
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
                <div className={`w-16 h-16 rounded-2xl ${problem.bg} ${problem.color} flex items-center justify-center mb-6`}>
                  <problem.icon className="w-8 h-8" />
                </div>
                <div className={`text-4xl font-bold ${problem.color} mb-3`}>{problem.stat}</div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">{problem.title}</h4>
                <p className="text-gray-600 leading-relaxed text-sm">{problem.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
