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
              <Card className="p-6" data-tour="patients-section">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Patient Management</h2>
                    <p className="text-muted-foreground mt-1">View and manage all your patients</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Users className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: "John Smith", email: "john@example.com", phone: "(555) 123-4567", lastVisit: "2024-10-28" },
                    { name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 234-5678", lastVisit: "2024-10-25" },
                    { name: "Mike Davis", email: "mike@example.com", phone: "(555) 345-6789", lastVisit: "2024-10-20" },
                    { name: "Emma Wilson", email: "emma@example.com", phone: "(555) 456-7890", lastVisit: "2024-10-15" },
                    { name: "David Brown", email: "david@example.com", phone: "(555) 567-8901", lastVisit: "2024-10-10" },
                  ].map((patient, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">{patient.email} • {patient.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Last Visit</div>
                        <div className="text-sm font-medium">{patient.lastVisit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'appointments' && (
            <div className="p-6">
              <Card className="p-6" data-tour="appointments-section">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Appointment Calendar</h2>
                    <p className="text-muted-foreground mt-1">Schedule and manage appointments</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    New Appointment
                  </Button>
                </div>

                {/* Weekly Calendar View */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 bg-muted/50">
                    <div className="p-3 text-sm font-semibold border-r">Time</div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="p-3 text-sm font-semibold text-center border-r last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'].map((time, idx) => (
                    <div key={time} className="grid grid-cols-6 border-t">
                      <div className="p-3 text-sm text-muted-foreground border-r bg-muted/30">{time}</div>
                      {[...Array(5)].map((_, dayIdx) => (
                        <div key={dayIdx} className="p-2 border-r last:border-r-0 min-h-[60px]">
                          {(idx + dayIdx) % 3 === 0 && (
                            <div className="bg-blue-100 text-blue-900 p-2 rounded text-xs">
                              <div className="font-semibold">Patient {idx + dayIdx + 1}</div>
                              <div className="text-[10px]">Checkup</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'employees' && (
            <div className="p-6">
              <Card className="p-6" data-tour="employees-section">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Staff Management</h2>
                    <p className="text-muted-foreground mt-1">Manage your team and their roles</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <UserCog className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "Dr. Emily Parker", role: "Lead Dentist", status: "Active", avatar: "EP" },
                    { name: "Jessica Martinez", role: "Dental Hygienist", status: "Active", avatar: "JM" },
                    { name: "Robert Chen", role: "Receptionist", status: "Active", avatar: "RC" },
                    { name: "Dr. Michael Brown", role: "Associate Dentist", status: "Active", avatar: "MB" },
                    { name: "Lisa Anderson", role: "Dental Assistant", status: "Active", avatar: "LA" },
                    { name: "Tom Wilson", role: "Office Manager", status: "Active", avatar: "TW" },
                  ].map((staff, idx) => (
                    <Card key={idx} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {staff.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">{staff.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          {staff.status}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'messages' && (
            <div className="p-6">
              <Card className="p-6" data-tour="messages-section">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Patient Messages</h2>
                    <p className="text-muted-foreground mt-1">Communicate securely with your patients</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    New Message
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Message List */}
                  <div className="md:col-span-1 space-y-2 border-r pr-4">
                    {[
                      { patient: "Sarah Johnson", preview: "Thank you for the appointment reminder!", time: "10 min ago", unread: true },
                      { patient: "John Smith", preview: "Can I reschedule my appointment?", time: "1 hour ago", unread: true },
                      { patient: "Mike Davis", preview: "Thanks for the cleaning today!", time: "2 hours ago", unread: false },
                      { patient: "Emma Wilson", preview: "Do I need to bring anything?", time: "Yesterday", unread: false },
                    ].map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg cursor-pointer transition-colors ${msg.unread ? 'bg-blue-50 border-2 border-blue-200' : 'bg-muted/30 hover:bg-muted'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-sm">{msg.patient}</div>
                          {msg.unread && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{msg.preview}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{msg.time}</div>
                      </div>
                    ))}
                  </div>

                  {/* Message Preview */}
                  <div className="md:col-span-2">
                    <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col">
                      <div className="flex items-center gap-3 pb-4 border-b mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          SJ
                        </div>
                        <div>
                          <div className="font-semibold">Sarah Johnson</div>
                          <div className="text-xs text-muted-foreground">Active 10 min ago</div>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-start">
                          <div className="bg-white p-3 rounded-lg max-w-[80%] shadow-sm">
                            <p className="text-sm">Hi! I received the reminder for my appointment tomorrow at 10 AM. Thank you!</p>
                            <div className="text-[10px] text-muted-foreground mt-1">10:25 AM</div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-lg max-w-[80%] shadow-sm">
                            <p className="text-sm">Great! Looking forward to seeing you tomorrow. Please arrive 10 minutes early.</p>
                            <div className="text-[10px] text-blue-100 mt-1">10:26 AM</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t mt-4">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Type your message..." 
                            className="flex-1 px-3 py-2 rounded-lg border bg-white"
                            disabled
                          />
                          <Button size="sm" className="bg-blue-600" disabled>Send</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
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
