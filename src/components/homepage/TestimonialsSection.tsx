import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Testimonial {
  name: string;
  role: string;
  practice: string;
  content: string;
  rating: number;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Owner & Dentist",
    practice: "Bright Smile Dental",
    content: "Caberu's AI reception has been a game-changer. We went from missing 30% of calls to answering every single one. Our appointment bookings increased by 45% in just the first month.",
    rating: 5,
  },
  {
    name: "Dr. James Peterson",
    role: "Practice Manager",
    practice: "Family Dental Care",
    content: "The 24/7 availability means patients can book appointments at 10 PM if they want. We've captured so many appointments that would have gone to competitors. Worth every penny.",
    rating: 5,
  },
  {
    name: "Dr. Maria Rodriguez",
    role: "Chief Dental Officer",
    practice: "Advanced Dental Group",
    content: "We run 3 locations and the centralized management is incredible. The AI handles patient routing perfectly, and our staff can focus on in-office care instead of answering phones all day.",
    rating: 5,
  },
  {
    name: "Dr. Michael Chen",
    role: "Dentist",
    practice: "Downtown Dental Studio",
    content: "As a solo practitioner, I can't afford a full-time receptionist. Caberu gives me enterprise-level phone handling at a fraction of the cost. My patients love the instant response.",
    rating: 5,
  },
  {
    name: "Dr. Emily Thompson",
    role: "Owner",
    practice: "Coastal Dental Associates",
    content: "The smart triage feature is outstanding. Emergency cases get flagged immediately, and routine appointments are scheduled seamlessly. It's like having the perfect receptionist who never takes a break.",
    rating: 5,
  },
  {
    name: "Dr. Robert Williams",
    role: "Managing Partner",
    practice: "Premier Dental Partners",
    content: "ROI was immediate. We calculated we save over $4,000/month compared to our old staffing model, plus we're booking 50+ more appointments monthly. The system paid for itself in week one.",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Trusted by Dental Professionals
          </h2>
          <p className="text-xl text-gray-600">
            See what dentists are saying about transforming their practices with Caberu
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-blue-100" />

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.practice}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-50 border border-green-200">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white"
                />
              ))}
            </div>
            <p className="text-sm font-medium text-gray-700">
              Join <span className="font-bold text-green-700">500+</span> practices using Caberu
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
