import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Capture Every Opportunity",
    description: "No more missed calls means no more lost patients. Every inquiry becomes a potential appointment."
  },
  {
    title: "Instant Patient Service",
    description: "Patients get immediate answers and booking - the convenience they expect in 2025."
  },
  {
    title: "Staff Focus on Care",
    description: "Your team can focus on in-office patients instead of constantly answering phones."
  },
  {
    title: "Increased Revenue",
    description: "More answered calls = more booked appointments = healthier practice growth."
  },
  {
    title: "Healthcare Compliant",
    description: "Built with GDPR and HIPAA considerations from day one."
  }
];

export const ResultsSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
             {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative z-10"
            >
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                  The Result: <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    More Patients, <br /> Happier Staff
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  See the immediate impact of automating your front desk. Caberu doesn't just answer phones; it transforms your practice's efficiency.
                </p>

                <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-2xl">😊</span>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Patient Satisfaction</div>
                            <div className="text-2xl font-bold text-gray-900">4.9/5.0</div>
                        </div>
                    </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "98%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-green-500 rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
