import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveDentalChat } from "@/components/chat/InteractiveDentalChat";
import { ModernSettings } from "@/components/ModernSettings";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { HealthData } from "@/components/HealthData";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { PatientAnalytics } from "@/components/analytics/PatientAnalytics";
import { ModernNotificationCenter } from "@/components/notifications/ModernNotificationCenter";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Calendar, Activity, AlertTriangle, Stethoscope, Clock, BarChart3, User as UserIcon, Shield, Heart, Bell, FileText, Pill, Target, TrendingUp, CheckCircle, XCircle, Loader2, RefreshCw, Plus, Eye, FileImage, ClipboardList as ClipboardListIcon, CreditCard, Settings as SettingsIcon, Home, ChevronRight, ArrowRight, Sparkles, Phone, Video, MessageCircle, CalendarDays, FileCheck, AlertCircle, Zap, Users, BookOpen, HelpCircle } from "lucide-react";
// Icons imported for patient dashboard navigation
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { Prescription, TreatmentPlan, MedicalRecord, PatientNote } from "@/types/dental";
import { Appointment, UserProfile } from "@/types/common";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PatientAppShell, PatientSection } from "@/components/patient/PatientAppShell";
import { HomeTab } from "@/components/patient/HomeTab";
import { CareTab, CareItem } from "@/components/patient/CareTab";
import { AppointmentsTab } from "@/components/patient/AppointmentsTab";
import { PaymentsTab } from "@/components/patient/PaymentsTab";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BookAppointment from "@/pages/BookAppointment";
// Lazy load Messages component for better code splitting
const Messages = lazy(() => import("@/pages/Messages"));
import { logger } from '@/lib/logger';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';
import { useBusinessContext } from '@/hooks/useBusinessContext';

interface PatientDashboardProps {
  user: User;
}
interface PatientStats {
  upcomingAppointments: number;
  completedAppointments: number;
  lastVisit: string | null;
  totalNotes: number;
  activeTreatmentPlans: number;
  totalPrescriptions: number;
  activePrescriptions: number;
}

// Navigation items with better organization
const getNavigationItems = (hasAIChat: boolean) => [{
  group: "Overview",
  items: [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: Home,
      badge: null
    },
    {
      id: 'chat',
      label: hasAIChat ? 'AI Assistant' : 'Classic Booking',
      icon: hasAIChat ? MessageSquare : Calendar,
      badge: hasAIChat ? 'AI' : null
    }
  ]
}, {
  group: "Appointments",
  items: [{
    id: 'appointments',
    label: 'My Appointments',
    icon: Calendar,
    badge: null
  }]
}, {
  group: "Health Records",
  items: [{
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: Pill,
    badge: null
  }, {
    id: 'treatment',
    label: 'Treatment Plans',
    icon: ClipboardListIcon,
    badge: null
  }, {
    id: 'records',
    label: 'Medical Records',
    icon: FileText,
    badge: null
  }, {
    id: 'notes',
    label: 'Clinical Notes',
    icon: FileCheck,
    badge: null
  }]
}, {
  group: "Financial",
  items: [{
    id: 'payments',
    label: 'Payment History',
    icon: CreditCard,
    badge: null
  }, {
    id: 'analytics',
    label: 'Health Analytics',
    icon: BarChart3,
    badge: null
  }]
}];
export const PatientDashboard = ({
  user
}: PatientDashboardProps) => {
  const {
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const { hasFeature, template } = useBusinessTemplate();
  const hasAIChat = hasFeature('aiChat');
  const navigationItems = getNavigationItems(hasAIChat);
  const { businessId, businessSlug } = useBusinessContext();
  type Tab = 'overview' | 'chat' | 'appointments' | 'prescriptions' | 'treatment' | 'records' | 'notes' | 'payments' | 'analytics' | 'test';
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      return localStorage.getItem('pd_tab') as Tab || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [triggerBooking, setTriggerBooking] = useState<'low' | 'medium' | 'high' | false>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStats>({
    upcomingAppointments: 0,
    completedAppointments: 0,
    lastVisit: null,
    totalNotes: 0,
    activeTreatmentPlans: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<PatientSection>(() => {
    try {
      return localStorage.getItem('pd_section') as PatientSection || 'home';
    } catch {
      return 'home';
    }
  });

  // Watch for custom section change events
  useEffect(() => {
    const handleSectionChange = (e: CustomEvent) => {
      if (e.detail?.section) {
        setActiveSection(e.detail.section);
      }
    };

    window.addEventListener('dashboard:changeSection' as any, handleSectionChange);

    return () => window.removeEventListener('dashboard:changeSection' as any, handleSectionChange);
  }, []);

  // Subscribe to real-time updates for medical records
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase.channel('medical-records-updates').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'medical_records',
      filter: `patient_id=eq.${userProfile.id}`
    }, payload => {
      // Add the new medical record to the list
      const newRecord = {
        ...payload.new,
        visit_date: payload.new.record_date
      } as MedicalRecord;
      setMedicalRecords(prev => [newRecord, ...prev]);

      // Show a toast notification
      toast({
        title: "New Medical Record",
        description: "A new medical record has been added to your file."
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, toast]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [totalDueCents, setTotalDueCents] = useState(0);
  // Messaging functionality removed

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('pd_tab', activeTab);
    } catch {
      // Handle localStorage errors silently
    }
  }, [activeTab, user.id]);
  useEffect(() => {
    try {
      localStorage.setItem('pd_section', activeSection);
    } catch {
      void 0;
    }
  }, [activeSection]);

  // Clear classic booking flag when navigating away from assistant section
  useEffect(() => {
    if (activeSection !== 'assistant') {
      try {
        if (localStorage.getItem('pd_forceClassic') === '1') {
          localStorage.removeItem('pd_forceClassic');
        }
      } catch {}
    }
  }, [activeSection]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const {
        data: profile,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) {
        console.error('Error fetching user profile:', error);
        setError(`Database error: ${error.message}`);
        return;
      }
      if (!profile) {
        // No profile exists for this user - create a basic one or handle gracefully
        console.warn('No profile found for user, creating basic profile...');

        // Try to create a basic profile from user data
        const {
          data: newProfile,
          error: createError
        } = await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: 'patient'
        }).select().single();
        if (createError) {
          console.error('Error creating profile:', createError);
          setError(`Failed to create user profile: ${createError.message}`);
          return;
        }
        setUserProfile(newProfile);
      } else {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError(`Profile loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  const fetchPatientStats = async (profileId: string) => {
    try {
      // Fetch appointments
      const {
        data: appointmentsData
      } = await supabase.from('appointments').select('*').eq('patient_id', profileId);
      const upcomingAppointments = appointmentsData?.filter(apt => new Date(apt.appointment_date) > new Date() && apt.status === 'confirmed').length || 0;
      const completedAppointments = appointmentsData?.filter(apt => apt.status === 'completed').length || 0;
      const lastVisit = appointmentsData?.filter(apt => apt.status === 'completed').sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]?.appointment_date || null;

      // Fetch prescriptions
      const {
        data: prescriptionsData
      } = await supabase.from('prescriptions').select('*').eq('patient_id', profileId);
      const activePrescriptions = prescriptionsData?.filter(p => p.status === 'active').length || 0;

      // Fetch treatment plans
      const {
        data: treatmentPlansData
      } = await supabase.from('treatment_plans').select('*').eq('patient_id', profileId);
      const activeTreatmentPlans = treatmentPlansData?.filter(tp => tp.status === 'active').length || 0;

      // Fetch patient notes
      const {
        data: notesData
      } = await supabase.from('patient_notes').select('*').eq('patient_id', profileId);
      setPatientStats({
        upcomingAppointments,
        completedAppointments,
        lastVisit,
        totalNotes: notesData?.length || 0,
        activeTreatmentPlans,
        totalPrescriptions: prescriptionsData?.length || 0,
        activePrescriptions
      });
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    }
  };
  const fetchRecentAppointments = async (profileId: string) => {
    try {
      const {
        data: appointmentsData,
        error
      } = await supabase.from('appointments').select(`
          *,
          dentists:dentist_id(
            specialization,
            profiles:profile_id(first_name, last_name)
          )
        `).eq('patient_id', profileId).order('appointment_date', {
        ascending: false
      }).limit(5);
      if (error) {
        console.error('❌ Error fetching appointments:', error);
        return;
      }
      const transformed = (appointmentsData || []).map(apt => ({
        ...apt,
        duration: apt.duration_minutes || 60,
        urgency_level: apt.urgency === 'emergency' ? 'urgent' : apt.urgency || 'normal',
        status: apt.status === 'pending' ? 'scheduled' : apt.status,
        // Transform the dentist data to match expected structure
        dentists: apt.dentists ? {
          first_name: apt.dentists.profiles?.first_name,
          last_name: apt.dentists.profiles?.last_name,
          specialization: apt.dentists.specialization
        } : undefined
      }));
      setRecentAppointments(transformed);
    } catch (error) {
      console.error('💥 Exception fetching recent appointments:', error);
    }
  };
  const fetchPatientData = async (profileId: string) => {
    try {
      // Fetch prescriptions
      const {
        data: prescriptionsData
      } = await supabase.from('prescriptions').select('*').eq('patient_id', profileId).order('prescribed_date', {
        ascending: false
      });
      setPrescriptions((prescriptionsData || []).map(prescription => ({
        ...prescription,
        duration: prescription.duration_days?.toString() || "7 days"
      })));

      // Fetch treatment plans
      const {
        data: treatmentPlansData
      } = await supabase.from('treatment_plans').select('*').eq('patient_id', profileId).order('created_at', {
        ascending: false
      });
      setTreatmentPlans((treatmentPlansData || []).map(plan => ({
        ...plan,
        title: plan.title || "Treatment Plan",
        estimated_duration: plan.estimated_duration_weeks ? `${plan.estimated_duration_weeks} weeks` : "2 weeks"
      })));

      // Fetch medical records
      const {
        data: medicalRecordsData
      } = await supabase.from('medical_records').select('*').eq('patient_id', profileId).order('record_date', {
        ascending: false
      });
      setMedicalRecords((medicalRecordsData || []).map(record => ({
        ...record,
        visit_date: record.record_date
      })));

      // Fetch patient notes
      const {
        data: notesData
      } = await supabase.from('patient_notes').select('*').eq('patient_id', profileId).order('created_at', {
        ascending: false
      });
      setPatientNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };
  const fetchTotalDue = useCallback(async (profileId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('payment_requests').select('amount,status').eq('patient_id', profileId);
      if (error) throw error;
      const openStatuses = new Set(['pending', 'overdue']);
      const total = (data || []).filter(r => openStatuses.has(r.status)).reduce((sum, r: any) => sum + (r.amount || 0), 0);
      setTotalDueCents(total);
    } catch (e) {
      console.error('Failed to load payment totals', e);
    }
  }, []);

  // Use useCallback to memoize functions to prevent infinite re-renders
  const fetchUserProfileCallback = useCallback(fetchUserProfile, [user.id]);
  const fetchPatientStatsCallback = useCallback(fetchPatientStats, []);
  const fetchRecentAppointmentsCallback = useCallback(fetchRecentAppointments, []);
  const fetchPatientDataCallback = useCallback(fetchPatientData, []);
  useEffect(() => {
    fetchUserProfileCallback();
  }, [fetchUserProfileCallback]);
  useEffect(() => {
    if (userProfile?.id) {
      fetchPatientStatsCallback(userProfile.id);
      fetchRecentAppointmentsCallback(userProfile.id);
      fetchPatientDataCallback(userProfile.id);
      fetchTotalDue(userProfile.id);
    }
  }, [userProfile?.id, fetchPatientStatsCallback, fetchRecentAppointmentsCallback, fetchPatientDataCallback, fetchTotalDue]);
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchUserProfile}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const nextAppointment = (() => {
    const now = new Date();
    const filtered = [...recentAppointments].filter(a => {
      const aptDate = new Date(a.appointment_date);
      const isFuture = aptDate > now;
      const hasValidStatus = ['confirmed', 'scheduled', 'pending'].includes(a.status);
      return isFuture && hasValidStatus;
    }).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    const next = filtered[0] || null;
    return next;
  })();
  const carePlans: CareItem[] = treatmentPlans.map(tp => ({
    id: tp.id,
    type: 'plan',
    title: tp.title || 'Treatment Plan',
    subtitle: tp.description || undefined,
    date: tp.start_date,
    status: tp.status,
    data: tp
  }));
  const carePrescriptions: CareItem[] = prescriptions.map(p => ({
    id: p.id,
    type: 'prescription',
    title: p.medication_name,
    subtitle: `${p.dosage} • ${p.frequency}`,
    date: p.prescribed_date,
    status: p.status,
    data: p
  }));
  const careVisits: CareItem[] = recentAppointments.map(a => ({
    id: a.id,
    type: 'visit',
    title: a.reason || 'Visit',
    subtitle: a.status,
    date: a.appointment_date,
    status: a.status,
    data: a
  }));
  const careRecords: CareItem[] = medicalRecords.map(r => ({
    id: r.id,
    type: 'record',
    title: r.title,
    subtitle: r.record_type,
    date: r.record_date,
    status: undefined,
    data: r
  }));
  const badges = {
    home: false,
    assistant: false,
    care: patientStats.activePrescriptions > 0 || patientStats.activeTreatmentPlans > 0,
    appointments: patientStats.upcomingAppointments > 0,
    payments: totalDueCents > 0,
    settings: !userProfile?.first_name || !userProfile?.last_name
    // messages functionality removed
  } as Record<PatientSection, boolean>;
  return <PatientAppShell 
    activeSection={activeSection} 
    onChangeSection={setActiveSection} 
    badges={badges} 
    userId={user.id} 
    hasAIChat={hasAIChat}
    onBookAppointment={() => setActiveSection('assistant')}
  >
      {activeSection === 'home' && <HomeTab userId={user.id} firstName={userProfile?.first_name} nextAppointment={nextAppointment ? (() => {
      const appointmentDetails = nextAppointment as unknown as Record<string, any>;
      const joinUrl = appointmentDetails.meeting_url || appointmentDetails.join_url || appointmentDetails.telehealth_url || appointmentDetails.virtual_meeting_url || appointmentDetails.video_url || appointmentDetails.video_meeting_url || appointmentDetails.conference_url || null;
      const rawVisitType = appointmentDetails.visit_type || appointmentDetails.type || appointmentDetails.appointment_type || appointmentDetails.mode || appointmentDetails.format || appointmentDetails.channel || '';
      const normalizedVisitType = typeof rawVisitType === 'string' ? rawVisitType.toLowerCase() : '';
      const baseIsVirtual = appointmentDetails.is_virtual ?? appointmentDetails.virtual ?? appointmentDetails.is_online ?? appointmentDetails.telehealth;
      const derivedIsVirtual = normalizedVisitType ? normalizedVisitType.includes('virtual') || normalizedVisitType.includes('tele') || normalizedVisitType.includes('online') || normalizedVisitType.includes('remote') : false;
      const isVirtual = Boolean(baseIsVirtual ?? (derivedIsVirtual || joinUrl));
      const location = appointmentDetails.location || appointmentDetails.location_description || appointmentDetails.clinic_location || appointmentDetails.address || appointmentDetails.office || appointmentDetails.meeting_location || null;
      return {
        id: nextAppointment.id,
        date: new Date(nextAppointment.appointment_date).toLocaleDateString(),
        time: new Date(nextAppointment.appointment_date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        dentistName: undefined,
        status: nextAppointment.status,
        isVirtual,
        joinUrl,
        location,
        visitType: typeof rawVisitType === 'string' ? rawVisitType : undefined
      };
    })() : null} activePrescriptions={patientStats.activePrescriptions} activeTreatmentPlans={patientStats.activeTreatmentPlans} totalDueCents={totalDueCents} onNavigateTo={s => setActiveSection(s)} onOpenAssistant={() => setActiveSection('assistant')} onBookAppointment={() => setActiveSection('assistant')} />}

      {activeSection === 'assistant' && (
        <div className="px-4 md:px-6 py-4">
          <Card>
            <CardContent>
              <div className="h-[70vh]">
                <InteractiveDentalChat user={user} triggerBooking={triggerBooking} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {activeSection === 'messages' && (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <Messages />
        </Suspense>
      )}

      {activeSection === 'care' && <CareTab plans={carePlans} prescriptions={carePrescriptions} visits={careVisits} records={careRecords} user={user} patientId={userProfile?.id || null} onReschedule={() => setActiveSection('assistant')} />}

      {activeSection === 'appointments' && <AppointmentsTab user={user} onOpenAssistant={() => setActiveSection('assistant')} />}

      {activeSection === 'payments' && userProfile?.id && <PaymentsTab patientId={userProfile.id} totalDueCents={totalDueCents} />}

      {activeSection === 'settings' && <div className="px-4 md:px-6 py-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveSection('home')} className="hover:bg-muted/50">
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage your account preferences and personal information</p>
          </div>
          <ModernSettings user={user} />
        </div>}

      <Dialog open={showAssistant} onOpenChange={setShowAssistant}>
        <DialogContent className="p-0 max-w-3xl w-full">
          <div className="h-[80vh]">
            {hasAIChat && <InteractiveDentalChat user={user} triggerBooking={triggerBooking} />}
          </div>
        </DialogContent>
      </Dialog>
    </PatientAppShell>;
};

// Helper components for the new structure
const DashboardOverview = ({
  userProfile,
  patientStats,
  recentAppointments,
  getWelcomeMessage,
  formatDate,
  getStatusColor,
  setActiveTab
}: {
  userProfile: UserProfile | null;
  patientStats: PatientStats;
  recentAppointments: Appointment[];
  getWelcomeMessage: () => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  setActiveTab: (tab: any) => void;
}) => <div className="space-y-6">
    {/* Quick Actions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40" onClick={() => setActiveTab('appointments')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-semibold mb-1">Book Appointment</h3>
          <p className="text-sm text-muted-foreground">Schedule your next visit</p>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-emerald-500/20 hover:border-emerald-500/40" onClick={() => setActiveTab('chat')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <MessageSquare className="h-6 w-6 text-emerald-500" />
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">AI</Badge>
          </div>
          <h3 className="font-semibold mb-1">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Get instant help</p>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-orange-500/20 hover:border-orange-500/40" onClick={() => setActiveTab('prescriptions')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
              <Pill className="h-6 w-6 text-orange-500" />
            </div>
            {patientStats.activePrescriptions > 0 && <Badge className="bg-orange-100 text-orange-700">{patientStats.activePrescriptions}</Badge>}
          </div>
          <h3 className="font-semibold mb-1">Prescriptions</h3>
          <p className="text-sm text-muted-foreground">View active medications</p>
        </CardContent>
      </Card>
    </div>

    {/* Stats Overview */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Appointments</p>
              <p className="text-3xl font-bold mt-2">{patientStats.upcomingAppointments}</p>
              {patientStats.lastVisit && <p className="text-xs text-muted-foreground mt-2">
                  Last visit: {formatDate(patientStats.lastVisit)}
                </p>}
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Visits</p>
              <p className="text-3xl font-bold mt-2">{patientStats.completedAppointments}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">Regular checkups</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
              <p className="text-3xl font-bold mt-2">{patientStats.activePrescriptions}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {patientStats.totalPrescriptions} prescribed
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Pill className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Treatment Plans</p>
              <p className="text-3xl font-bold mt-2">{patientStats.activeTreatmentPlans}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {patientStats.totalNotes} clinical notes
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <ClipboardListIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Recent Activity & Health Summary */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Appointments */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Appointments</span>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('appointments')}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAppointments.slice(0, 3).map(appointment => <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", appointment.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30' : appointment.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30')}>
                    <Calendar className={cn("h-5 w-5", appointment.status === 'completed' ? 'text-blue-600 dark:text-blue-400' : appointment.status === 'confirmed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')} />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.reason || 'General Checkup'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(appointment.appointment_date)} at {new Date(appointment.appointment_date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>)}
            {recentAppointments.length === 0 && <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments yet</p>
                <Button className="mt-4" onClick={() => setActiveTab('appointments')}>
                  Book Your First Appointment
                </Button>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Health Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Health</span>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Good</Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Checkup</span>
                <span className="font-medium">
                  {patientStats.lastVisit ? formatDate(patientStats.lastVisit) : 'Not yet'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Due</span>
                <span className="font-medium text-orange-600">In 2 months</span>
              </div>
            </div>
            <Separator />
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Recommendations</p>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Regular brushing twice daily</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Schedule cleaning soon</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
const PrescriptionsView = ({
  prescriptions,
  formatDate,
  getStatusColor
}: {
  prescriptions: Prescription[];
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}) => <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Your Prescriptions</h3>
    </div>
    <div className="space-y-2">
      {prescriptions.map(prescription => <Card key={prescription.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Pill className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">{prescription.medication_name}</p>
                  <p className="text-sm text-gray-600">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  <p className="text-xs text-gray-500">
                    Prescribed: {formatDate(prescription.prescribed_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(prescription.status)}>
                  {prescription.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
      {prescriptions.length === 0 && <div className="text-center py-8">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions</h3>
          <p className="text-gray-600">You don't have any prescriptions yet.</p>
        </div>}
    </div>
  </div>;
const TreatmentPlansView = ({
  treatmentPlans,
  formatDate,
  getStatusColor
}: {
  treatmentPlans: TreatmentPlan[];
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}) => <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Your Treatment Plans</h3>
    </div>
    <div className="space-y-2">
      {treatmentPlans.map(plan => <Card key={plan.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ClipboardListIcon className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">{plan.title}</p>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <p className="text-xs text-gray-500">
                    Started: {formatDate(plan.start_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(plan.status)}>
                  {plan.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
      {treatmentPlans.length === 0 && <div className="text-center py-8">
          <ClipboardListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No treatment plans</h3>
          <p className="text-gray-600">You don't have any treatment plans yet.</p>
        </div>}
    </div>
  </div>;
const MedicalRecordsView = ({
  medicalRecords,
  formatDate
}: {
  medicalRecords: MedicalRecord[];
  formatDate: (dateString: string) => string;
}) => <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Your Medical Records</h3>
    </div>
    <div className="space-y-2">
      {medicalRecords.map(record => <Card key={record.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{record.title}</p>
                  <p className="text-sm text-gray-600">{record.record_type}</p>
                  <p className="text-xs text-gray-500">
                    Date: {formatDate(record.record_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
      {medicalRecords.length === 0 && <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records</h3>
          <p className="text-gray-600">You don't have any medical records yet.</p>
        </div>}
    </div>
  </div>;
const PatientNotesView = ({
  patientNotes,
  formatDate
}: {
  patientNotes: PatientNote[];
  formatDate: (dateString: string) => string;
}) => <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Your Notes</h3>
    </div>
    <div className="space-y-2">
      {patientNotes.map(note => <Card key={note.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-gray-600">{note.note_type}</p>
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(note.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
      {patientNotes.length === 0 && <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes</h3>
          <p className="text-gray-600">You don't have any notes yet.</p>
        </div>}
    </div>
  </div>;