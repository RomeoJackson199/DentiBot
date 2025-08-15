import React, { useState } from "react";
import { EnhancedPatientDashboard } from "@/components/patient/EnhancedPatientDashboard";
import { EnhancedAppointmentsView } from "@/components/patient/EnhancedAppointmentsView";
import { EnhancedHealthOverview } from "@/components/patient/EnhancedHealthOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Smartphone,
  Monitor,
  Tablet,
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

// Mock user for testing
const mockUser = {
  id: "test-user-123",
  email: "patient@example.com",
  user_metadata: {
    first_name: "Sarah",
    last_name: "Johnson"
  },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString()
};

const TestEnhancedPatientDashboard = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'dashboard' | 'appointments' | 'health'>('dashboard');
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const getViewportClass = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-3xl mx-auto';
      default:
        return 'max-w-7xl mx-auto';
    }
  };

  const mockAppointments = [
    {
      id: '1',
      date: '2024-01-15',
      time: '14:30',
      dentistName: 'Dr. Sarah Johnson',
      dentistImage: '',
      type: 'Regular Checkup',
      duration: 60,
      location: 'Main Clinic - Room 102',
      status: 'confirmed' as const,
      notes: 'Regular 6-month checkup and cleaning',
      priority: 'medium' as const,
      canReschedule: true,
      canCancel: true,
      videoCall: false
    },
    {
      id: '2',
      date: '2024-01-22',
      time: '10:00',
      dentistName: 'Dr. Michael Chen',
      dentistImage: '',
      type: 'Teeth Cleaning',
      duration: 45,
      location: 'Downtown Clinic - Room 201',
      status: 'upcoming' as const,
      notes: 'Deep cleaning session',
      priority: 'low' as const,
      canReschedule: true,
      canCancel: true,
      videoCall: true
    },
    {
      id: '3',
      date: '2024-01-08',
      time: '16:00',
      dentistName: 'Dr. Sarah Johnson',
      dentistImage: '',
      type: 'Root Canal - Session 2',
      duration: 90,
      location: 'Main Clinic - Room 102',
      status: 'completed' as const,
      notes: 'Second session of root canal treatment',
      priority: 'high' as const,
      canReschedule: false,
      canCancel: false,
      videoCall: false
    }
  ];

  const handleBookAppointment = () => {
    toast({
      title: "Book Appointment",
      description: "Appointment booking flow would open here",
    });
  };

  const handleReschedule = (appointmentId: string) => {
    toast({
      title: "Reschedule Appointment",
      description: `Rescheduling appointment ${appointmentId}`,
    });
  };

  const handleCancel = (appointmentId: string) => {
    toast({
      title: "Cancel Appointment",
      description: `Cancelling appointment ${appointmentId}`,
      variant: "destructive"
    });
  };

  const handleViewDetails = (appointmentId: string) => {
    toast({
      title: "View Details",
      description: `Viewing details for appointment ${appointmentId}`,
    });
  };

  const handleViewHealthDetails = (metricId: string) => {
    toast({
      title: "Health Details",
      description: `Viewing details for health metric: ${metricId}`,
    });
  };

  const handleSetGoal = () => {
    toast({
      title: "Set Health Goal",
      description: "Health goal setting dialog would open here",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Enhanced Patient Dashboard Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Viewport Size Controls */}
            <div>
              <label className="text-sm font-medium mb-2 block">Viewport Size</label>
              <div className="flex space-x-2">
                {[
                  { id: 'mobile', label: 'Mobile', icon: Smartphone },
                  { id: 'tablet', label: 'Tablet', icon: Tablet },
                  { id: 'desktop', label: 'Desktop', icon: Monitor }
                ].map((size) => (
                  <Button
                    key={size.id}
                    variant={viewportSize === size.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewportSize(size.id as any)}
                  >
                    <size.icon className="h-4 w-4 mr-2" />
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Controls */}
            <div>
              <label className="text-sm font-medium mb-2 block">Component View</label>
              <div className="flex space-x-2">
                {[
                  { id: 'dashboard', label: 'Full Dashboard' },
                  { id: 'appointments', label: 'Appointments Only' },
                  { id: 'health', label: 'Health Overview Only' }
                ].map((view) => (
                  <Button
                    key={view.id}
                    variant={currentView === view.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView(view.id as any)}
                  >
                    {view.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Features Implemented</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Responsive Design', status: 'completed' },
                  { label: 'Touch Interactions', status: 'completed' },
                  { label: 'Health Metrics', status: 'completed' },
                  { label: 'Swipe Gestures', status: 'completed' },
                  { label: 'Mobile Navigation', status: 'completed' },
                  { label: 'Animation Effects', status: 'completed' },
                  { label: 'Goal Tracking', status: 'completed' },
                  { label: 'Dark Mode Support', status: 'pending' }
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center space-x-2">
                    {feature.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : feature.status === 'pending' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-xs">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Content */}
      <div className={getViewportClass()}>
        <div className="border rounded-lg overflow-hidden">
          {currentView === 'dashboard' && (
            <EnhancedPatientDashboard user={mockUser as any} />
          )}

          {currentView === 'appointments' && (
            <div className="p-4">
              <EnhancedAppointmentsView
                appointments={mockAppointments}
                onBook={handleBookAppointment}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}

          {currentView === 'health' && (
            <div className="p-4">
              <EnhancedHealthOverview
                patientId={mockUser.id}
                onViewDetails={handleViewHealthDetails}
                onSetGoal={handleSetGoal}
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Testing Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Mobile Testing:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Switch to Mobile viewport and test touch interactions</li>
                <li>Try swiping left/right on appointment cards</li>
                <li>Test bottom navigation functionality</li>
                <li>Verify responsive layout adapts correctly</li>
              </ul>
            </div>
            <div>
              <strong>Health Overview Testing:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Click on health metric cards to expand details</li>
                <li>Test tab navigation between Overview, Metrics, Goals, History</li>
                <li>Verify progress bars and trend indicators work</li>
              </ul>
            </div>
            <div>
              <strong>Appointments Testing:</strong>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Click appointment cards to view details modal</li>
                <li>Test swipe gestures on mobile</li>
                <li>Verify status badges and priority indicators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEnhancedPatientDashboard;