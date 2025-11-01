import { Card } from "@/components/ui/card";
import { Calendar, AlertCircle, BarChart3, Users } from "lucide-react";
import { StatCard } from "@/components/ui/polished-components";

export function DemoClinicalToday() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="stats-cards">
        <StatCard
          title="Today's Appointments"
          value="12"
          icon={Calendar}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Urgent Cases"
          value="3"
          icon={AlertCircle}
          gradient="from-red-500 to-orange-500"
        />
        <StatCard
          title="Completion Rate"
          value="94%"
          icon={BarChart3}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Total Patients"
          value="248"
          icon={Users}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Today's Appointments List */}
      <Card className="p-6" data-tour="appointments-list">
        <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
        <div className="space-y-3">
          {[
            { time: "9:00 AM", patient: "John Smith", reason: "Routine Checkup", urgent: false },
            { time: "10:30 AM", patient: "Sarah Johnson", reason: "Tooth Pain", urgent: true },
            { time: "11:00 AM", patient: "Mike Davis", reason: "Cleaning", urgent: false },
            { time: "2:00 PM", patient: "Emma Wilson", reason: "Root Canal", urgent: true },
            { time: "3:00 PM", patient: "David Brown", reason: "Follow-up", urgent: false },
          ].map((apt, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-muted-foreground w-24">{apt.time}</div>
                <div>
                  <div className="font-medium">{apt.patient}</div>
                  <div className="text-sm text-muted-foreground">{apt.reason}</div>
                </div>
              </div>
              {apt.urgent && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                  Urgent
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
