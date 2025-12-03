import { motion } from "framer-motion";

const logos = [
    { name: "Bright Smile Dental", icon: "🦷" },
    { name: "Family Dental Care", icon: "🏥" },
    { name: "Advanced Dental Group", icon: "✨" },
    { name: "Downtown Dental Studio", icon: "🏙️" },
    { name: "Coastal Dental Associates", icon: "🌊" },
    { name: "Premier Dental Partners", icon: "🤝" },
    { name: "Smile Innovations", icon: "💡" },
    { name: "Perfect Teeth Clinic", icon: "⭐" },
];

export const SocialProofTicker = () => {
    return (
        <section className="py-10 bg-slate-50 border-y border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Trusted by 500+ Forward-Thinking Practices
                </p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
                    {/* First set of logos */}
                    {logos.map((logo, index) => (
                        <div key={index} className="flex items-center gap-3 text-slate-400 font-semibold text-lg grayscale hover:grayscale-0 transition-all duration-300 cursor-default">
                            <span className="text-2xl">{logo.icon}</span>
                            <span>{logo.name}</span>
                        </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {logos.map((logo, index) => (
                        <div key={`duplicate-${index}`} className="flex items-center gap-3 text-slate-400 font-semibold text-lg grayscale hover:grayscale-0 transition-all duration-300 cursor-default">
                            <span className="text-2xl">{logo.icon}</span>
                            <span>{logo.name}</span>
                        </div>
                    ))}
                    {/* Triplicate set for seamless loop on wide screens */}
                    {logos.map((logo, index) => (
                        <div key={`triplicate-${index}`} className="flex items-center gap-3 text-slate-400 font-semibold text-lg grayscale hover:grayscale-0 transition-all duration-300 cursor-default">
                            <span className="text-2xl">{logo.icon}</span>
                            <span>{logo.name}</span>
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-50 to-transparent z-10" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-50 to-transparent z-10" />
            </div>
        </section>
    );
};
