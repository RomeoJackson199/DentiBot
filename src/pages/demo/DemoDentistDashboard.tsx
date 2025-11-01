import { useState } from "react";
import { DentistAppShell, DentistSection } from "@/components/layout/DentistAppShell";
import { DentistDemoTour } from "@/components/DentistDemoTour";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Users, UserCog, MessageSquare, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DemoDentistDashboard() {
  const [activeSection, setActiveSection] = useState<DentistSection>('dashboard');
  const [showDemoTour, setShowDemoTour] = useState(true);
  const navigate = useNavigate();

  // Get demo data from sessionStorage
  const demoBusinessName = sessionStorage.getItem('demo_business_name') || 'Demo Clinic';
  const demoTemplate = sessionStorage.getItem('demo_template') || 'dentist';

  const handleTourComplete = () => {
    setShowDemoTour(false);
    // Show signup prompt after tour
    setTimeout(() => {
      if (confirm('Ready to create your own practice? Sign up now for just €1!')) {
        // Store demo data for pre-filling
        navigate('/signup');
      }
    }, 500);
  };

  return (
    <div className="relative">
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        🎭 Demo Mode - {demoBusinessName} | Exploring {demoTemplate} template
      </div>

      <div className="pt-10">
        <DentistAppShell
          activeSection={activeSection}
          onChangeSection={setActiveSection}
          dentistId="demo-dentist-id"
        >
          {activeSection === 'dashboard' && (
            <div className="p-6">
              {/* Demo Notice */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3" data-tour="demo-notice">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Welcome to Your Demo Experience!</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Follow the interactive tour to explore all features. This is a fully functional demo with sample data.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="border-blue-300 hover:bg-blue-100"
                >
                  Exit Demo
                </Button>
              </div>

              {/* Demo Dashboard Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6" data-tour="stats-cards">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Appointments</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Urgent Cases</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">94%</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-2xl font-bold">248</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Demo Appointments List */}
              <Card className="p-6" data-tour="appointments-list">
                <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
                <div className="space-y-3">
                  {[
                    { time: "9:00 AM", patient: "John Smith", reason: "Routine Checkup", urgent: false },
                    { time: "10:30 AM", patient: "Sarah Johnson", reason: "Tooth Pain", urgent: true },
                    { time: "11:00 AM", patient: "Mike Davis", reason: "Cleaning", urgent: false },
                    { time: "2:00 PM", patient: "Emma Wilson", reason: "Root Canal", urgent: true },
                  ].map((apt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-muted-foreground w-20">{apt.time}</div>
                        <div>
                          <div className="font-medium">{apt.patient}</div>
                          <div className="text-sm text-muted-foreground">{apt.reason}</div>
                        </div>
                      </div>
                      {apt.urgent && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Urgent</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'patients' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border p-8 text-center">
                <h2 className="text-2xl font-bold mb-2" data-tour="patients-section">Patient Management</h2>
                <p className="text-muted-foreground">
                  Here you can manage all your patients, view their records, and track their treatment history.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'appointments' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border p-8 text-center">
                <h2 className="text-2xl font-bold mb-2" data-tour="appointments-section">Appointment Scheduling</h2>
                <p className="text-muted-foreground">
                  Schedule appointments, view your calendar, and manage your availability all in one place.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'employees' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border p-8 text-center">
                <h2 className="text-2xl font-bold mb-2" data-tour="employees-section">Staff Management</h2>
                <p className="text-muted-foreground">
                  Manage your team members, assign roles, and coordinate with your dental professionals.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'messages' && (
            <div className="p-6">
              <div className="bg-white rounded-lg border p-8 text-center">
                <h2 className="text-2xl font-bold mb-2" data-tour="messages-section">Patient Messages</h2>
                <p className="text-muted-foreground">
                  Communicate with your patients securely and send appointment reminders.
                </p>
              </div>
            </div>
          )}
        </DentistAppShell>

        {/* Interactive Demo Tour */}
        <DentistDemoTour
          run={showDemoTour}
          onClose={handleTourComplete}
          onChangeSection={(section) => setActiveSection(section)}
        />
      </div>
    </div>
  );
}
