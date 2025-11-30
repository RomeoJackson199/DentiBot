import {
  Bot,
  Zap,
  Clock,
  Activity,
  ClipboardList,
  LayoutDashboard,
  Phone,
  Users,
  CreditCard,
  BarChart,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
  gradient?: string;
  children?: React.ReactNode;
}

const BentoCard = ({ title, description, icon: Icon, className, gradient, children }: BentoCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-3xl p-6 sm:p-8",
      "bg-white border border-gray-100 shadow-sm",
      className
    )}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 shadow-sm text-gray-900">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-gray-500 leading-relaxed mb-4">
        {description}
      </p>

      {children}
    </div>
  </div>
);

export const BentoGridFeatures = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Everything Your Practice Needs, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              All in One Place
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* AI Phone Reception */}
          <BentoCard
            title="AI Phone Reception"
            description="Natural AI conversation handles calls 24/7. Answers in under 2 seconds, books appointments instantly, and never misses a patient."
            icon={Phone}
            className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 border-blue-100"
            gradient="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <div className="mt-4 flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600 font-medium">100% Answer Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600 font-medium">24/7 Available</span>
              </div>
            </div>
          </BentoCard>

          {/* Appointment Scheduling */}
          <BentoCard
            title="Smart Scheduling"
            description="Calendar integration, automated booking, SMS reminders, and intelligent conflict resolution. Book 3X more appointments."
            icon={Zap}
            gradient="bg-blue-600"
          />

          {/* Automated Reminders */}
          <BentoCard
            title="Automated Reminders"
            description="Reduce no-shows by 30% with intelligent SMS and email appointment reminders. Automated follow-ups ensure patients never forget."
            icon={Bell}
            className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-indigo-100"
            gradient="bg-gradient-to-r from-indigo-600 to-blue-600"
          >
            <div className="mt-4 flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600 font-medium">30% Fewer No-Shows</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span className="text-gray-600 font-medium">Auto SMS & Email</span>
              </div>
            </div>
          </BentoCard>

          {/* Patient Management */}
          <BentoCard
            title="Patient Records"
            description="Complete digital health records, treatment history, prescriptions, insurance, and documents - all HIPAA compliant."
            icon={Users}
            gradient="bg-purple-600"
          />

          {/* Billing & Payments */}
          <BentoCard
            title="Billing & Payments"
            description="Integrated payment processing, invoice generation, insurance tracking, and automated payment reminders."
            icon={CreditCard}
            gradient="bg-emerald-600"
          />

          {/* Analytics */}
          <BentoCard
            title="Practice Analytics"
            description="Real-time insights on appointments, revenue, patient trends, and staff performance. Make data-driven decisions."
            icon={BarChart}
            gradient="bg-orange-600"
          />

          {/* Patient Portal */}
          <BentoCard
            title="Patient Portal"
            description="Self-service portal for patients to book, view records, pay bills, and message providers. Reduce admin by 80%."
            icon={LayoutDashboard}
            gradient="bg-pink-600"
          />

          {/* Smart Triage */}
          <BentoCard
            title="Emergency Triage"
            description="AI identifies urgent cases and alerts you immediately via SMS/email. Never miss a critical patient need."
            icon={Activity}
            gradient="bg-red-600"
            className="col-span-1 md:col-span-2 lg:col-span-3"
          />

        </div>

        <div className="mt-16 text-center">
          <p className="text-xl text-gray-600 mb-4">
            Plus: Inventory management • Staff scheduling • Automated reminders • Multi-location support • API access • And much more...
          </p>
        </div>
      </div>
    </section>
  );
};
