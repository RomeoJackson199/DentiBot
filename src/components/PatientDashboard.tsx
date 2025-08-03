import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { InteractiveDentalChat } from "@/components/chat/InteractiveDentalChat";
import { AppointmentsList } from "@/components/AppointmentsList";
import { Settings } from "@/components/Settings";
import { EnhancedPatientDossier } from "@/components/enhanced/EnhancedPatientDossier";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { PatientAnalytics } from "@/components/analytics/PatientAnalytics";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Calendar, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Clock,
  BarChart3
} from "lucide-react";

interface PatientDashboardProps {
  user: User;
}

export const PatientDashboard = ({ user }: PatientDashboardProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'chat' | 'appointments' | 'dossier' | 'analytics' | 'emergency'>('chat');
  const [triggerBooking, setTriggerBooking] = useState<'low' | 'medium' | 'high' | 'emergency' | false>(false);

  const handleEmergencyComplete = (urgency: 'low' | 'medium' | 'high' | 'emergency') => {
    setActiveTab('chat');
    // Trigger emergency booking with urgency level and pass urgency data
    setTriggerBooking(urgency);
  };

  return (
    <>
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4 sm:w-20 sm:h-20 sm:-top-5 sm:-left-5"></div>
              <div className="relative p-2 sm:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold gradient-text">Denti Bot Unified</h2>
              <p className="text-sm text-dental-muted-foreground">Patient Dashboard</p>
            </div>
          </div>
          <Settings user={user} />
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Quick Emergency Access */}
        <div className="mb-6">
          <Button
            onClick={() => setActiveTab('emergency')}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white shadow-elegant"
            size="lg"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Assessment
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="glass-card rounded-2xl p-2 sm:p-3 animate-fade-in w-full max-w-4xl">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'chat' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">AI Chat</span>
              </Button>
              
              <Button
                variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'appointments' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Appointments</span>
              </Button>

              <Button
                variant={activeTab === 'dossier' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dossier')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'dossier' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Health</span>
              </Button>

              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </Button>

              <Button
                variant={activeTab === 'emergency' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('emergency')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'emergency' 
                    ? 'bg-destructive text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-105'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-medium">Urgent</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in space-y-6">
          {activeTab === 'chat' && (
            <InteractiveDentalChat
              user={user}
              triggerBooking={triggerBooking}
              onBookingTriggered={() => setTriggerBooking(false)}
            />
          )}
          
          {activeTab === 'appointments' && (
            <AppointmentsList user={user} />
          )}
          
          {activeTab === 'dossier' && (
            <EnhancedPatientDossier user={user} mode="patient" />
          )}
          
          {activeTab === 'analytics' && (
            <PatientAnalytics userId={user.id} />
          )}
          
          {activeTab === 'emergency' && (
            <EmergencyTriageForm 
              onComplete={handleEmergencyComplete}
              onCancel={() => setActiveTab('chat')}
            />
          )}
        </div>
      </main>
    </>
  );
};