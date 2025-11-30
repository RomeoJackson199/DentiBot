import { Building2, MapPin, Users, Award } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Dental Practices",
    color: "text-blue-600"
  },
  {
    icon: Users,
    value: "50K+",
    label: "Appointments Booked",
    color: "text-purple-600"
  },
  {
    icon: MapPin,
    value: "45",
    label: "States Covered",
    color: "text-green-600"
  },
  {
    icon: Award,
    value: "4.9/5",
    label: "Customer Rating",
    color: "text-yellow-600"
  }
];

// Sample practice logos/names - replace with actual customer logos when available
const trustedPractices = [
  "Bright Smile Dental",
  "Family Dental Care",
  "Advanced Dental Group",
  "Downtown Dental Studio",
  "Coastal Dental Associates",
  "Premier Dental Partners",
  "Smile Innovations",
  "Perfect Teeth Clinic"
];

export const TrustedBySection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Trusted by Leading Practices
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            Join Hundreds of Practices Already Using Caberu
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Practice Names */}
        <div className="relative overflow-hidden py-8">
          <div className="flex gap-8 flex-wrap justify-center">
            {trustedPractices.map((practice, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-gray-700 font-medium whitespace-nowrap">{practice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-700">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-700">SOC 2 Type II</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-sm font-medium text-purple-700">256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-sm font-medium text-gray-700">99.9% Uptime SLA</span>
          </div>
        </div>
      </div>
    </section>
  );
};
