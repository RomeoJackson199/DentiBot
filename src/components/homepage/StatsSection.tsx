import { Zap, Server, PhoneIncoming } from "lucide-react";

const stats = [
  {
    value: "27ms",
    label: "Slot Finding",
    sublabel: "Real-time database query speed",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    value: "24/7",
    label: "Always Available",
    sublabel: "Zero downtime architecture",
    icon: Server, // Using Server as a proxy for "Always Available" tech aspect, or Clock
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    value: "100%",
    label: "Calls Answered",
    sublabel: "No busy signals, ever",
    icon: PhoneIncoming,
    color: "text-green-500",
    bg: "bg-green-500/10"
  }
];

export const StatsSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:32px_32px]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900 via-transparent to-gray-900"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-xl text-gray-400">
            Caberu combines cutting-edge voice AI with lightning-fast appointment matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="relative p-8 rounded-3xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm text-center"
            >
              <div className={`inline-flex p-4 rounded-2xl ${stat.bg} ${stat.color} mb-6`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-5xl font-extrabold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xl font-bold text-gray-200 mb-2">
                {stat.label}
              </div>
              <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
