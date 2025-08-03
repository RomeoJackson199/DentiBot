import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Calendar, 
  User as UserIcon, 
  ArrowLeft,
  Pill,
  ClipboardList,
  MessageSquare,
  Brain,
  Activity,
  Heart,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PrescriptionManager } from "@/components/PrescriptionManager";
import { TreatmentPlanManager } from "@/components/TreatmentPlanManager";
import { SimpleAppointmentBooking } from "@/components/SimpleAppointmentBooking";
import { AIConversationDialog } from "@/components/AIConversationDialog";

interface EnhancedPatientDossierProps {
  user: User;
  onBack?: () => void;
  patientId?: string;
  dentistId?: string;
  mode?: 'patient' | 'dentist';
}

interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  last_appointment_date: string | null;
  total_notes: number;
  active_treatment_plans: number;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  prescribed_date: string;
  status: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimated_cost: number;
  estimated_duration_weeks: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  consultation_notes: string;
  urgency: string;
}

export const EnhancedPatientDossier = ({ 
  user, 
  onBack, 
  patientId: propPatientId, 
  dentistId,
  mode = 'patient' 
}: EnhancedPatientDossierProps) => {
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAIConsultation, setShowAIConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const patientId = mode === 'dentist' ? propPatientId : null;
  const userId = mode === 'patient' ? user.id : null;

  useEffect(() => {
    loadPatientDossier();
  }, [user, patientId, userId]);

  const loadPatientDossier = async () => {
    try {
      setIsLoading(true);

      let profile: any = null;
      
      if (mode === 'patient') {
        // Load current user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        profile = profileData;
      } else if (mode === 'dentist' && patientId) {
        // Load specific patient profile for dentist view
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .single();

        if (profileError) throw profileError;
        profile = profileData;
      }

      if (!profile) {
        throw new Error('Patient profile not found');
      }

      setPatientProfile(profile);

      // Load enhanced data in parallel
      const [
        medicalRecordsResult,
        statsResult,
        prescriptionsResult,
        treatmentPlansResult,
        appointmentsResult
      ] = await Promise.allSettled([
        loadMedicalRecords(profile.id),
        loadPatientStats(profile.id),
        loadPrescriptions(profile.id),
        loadTreatmentPlans(profile.id),
        loadAppointments(profile.id)
      ]);

      // Handle results
      if (medicalRecordsResult.status === 'fulfilled') {
        setMedicalRecords(medicalRecordsResult.value);
      }
      if (statsResult.status === 'fulfilled') {
        setPatientStats(statsResult.value);
      }
      if (prescriptionsResult.status === 'fulfilled') {
        setPrescriptions(prescriptionsResult.value);
      }
      if (treatmentPlansResult.status === 'fulfilled') {
        setTreatmentPlans(treatmentPlansResult.value);
      }
      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(appointmentsResult.value);
      }

    } catch (error) {
      console.error('Error loading dossier:', error);
      toast({
        title: "Error",
        description: "Failed to load patient dossier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMedicalRecords = async (profileId: string) => {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        dentist:dentists(
          profile:profiles(first_name, last_name, specialty)
        )
      `)
      .eq('patient_id', profileId)
      .order('visit_date', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const loadPatientStats = async (profileId: string) => {
    if (!dentistId) return null;

    const { data, error } = await supabase
      .rpc('get_patient_stats_for_dentist', {
        p_dentist_id: dentistId,
        p_patient_id: profileId
      });

    if (error) throw error;
    return data?.[0] || null;
  };

  const loadPrescriptions = async (profileId: string) => {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', profileId)
      .order('prescribed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const loadTreatmentPlans = async (profileId: string) => {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const loadAppointments = async (profileId: string) => {
    let query = supabase
      .from('appointments')
      .select('id, appointment_date, status, reason, consultation_notes, urgency')
      .eq('patient_id', profileId)
      .order('appointment_date', { ascending: false });

    if (dentistId) {
      query = query.eq('dentist_id', dentistId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <Card className="floating-card">
        <CardHeader className="bg-gradient-primary text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">
                  {mode === 'patient' ? 'Mon Dossier Médical' : 'Dossier Patient'}
                </CardTitle>
                <p className="text-white/80 text-sm">
                  {patientProfile?.first_name} {patientProfile?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'dentist' && dentistId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIConsultation(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Consultation
                </Button>
              )}
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Enhanced Patient Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">
                  {patientProfile?.first_name} {patientProfile?.last_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {patientProfile?.date_of_birth 
                    ? formatDate(patientProfile.date_of_birth)
                    : 'Non renseigné'}
                </p>
              </div>
            </div>

            {patientProfile?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{patientProfile.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patientProfile?.email}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid (for dentist view) */}
          {patientStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{patientStats.total_appointments}</div>
                <div className="text-sm text-muted-foreground">Total RDV</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{patientStats.upcoming_appointments}</div>
                <div className="text-sm text-muted-foreground">À venir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{patientStats.completed_appointments}</div>
                <div className="text-sm text-muted-foreground">Terminés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{prescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Prescriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{treatmentPlans.length}</div>
                <div className="text-sm text-muted-foreground">Plans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{patientStats.total_notes}</div>
                <div className="text-sm text-muted-foreground">Notes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          <TabsTrigger value="records">Dossiers</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="treatments">Traitements</TabsTrigger>
          {mode === 'dentist' && (
            <>
              <TabsTrigger value="add-prescription">+ Prescription</TabsTrigger>
              <TabsTrigger value="add-treatment">+ Traitement</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview">
          <Card className="floating-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Informations médicales</h3>
                  <div className="space-y-3">
                    <p className="text-sm">
                      <strong>Historique médical:</strong> {patientProfile?.medical_history || 'Aucun historique enregistré'}
                    </p>
                    <p className="text-sm">
                      <strong>Adresse:</strong> {patientProfile?.address || 'Non renseignée'}
                    </p>
                    <p className="text-sm">
                      <strong>Contact d'urgence:</strong> {patientProfile?.emergency_contact || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Dernières activités</h3>
                  <div className="space-y-2">
                    {appointments.slice(0, 3).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{apt.reason}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(apt.appointment_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="floating-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rendez-vous</CardTitle>
              {mode === 'dentist' && dentistId && patientProfile && (
                <SimpleAppointmentBooking
                  dentistId={dentistId}
                  patientId={patientProfile.id}
                  patientName={`${patientProfile.first_name} ${patientProfile.last_name}`}
                  onSuccess={loadPatientDossier}
                />
              )}
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rendez-vous trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{appointment.reason}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointment_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                              {appointment.status}
                            </Badge>
                            {appointment.urgency && (
                              <Badge variant="outline" className="ml-2">
                                {appointment.urgency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {appointment.consultation_notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm">{appointment.consultation_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card className="floating-card">
            <CardHeader>
              <CardTitle>Dossiers médicaux</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun dossier médical trouvé</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {medicalRecords.map((record) => (
                      <Card key={record.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{record.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(record.visit_date)}
                              </p>
                            </div>
                            <Badge variant="outline">{record.record_type}</Badge>
                          </div>
                          
                          {record.description && (
                            <div className="mb-3">
                              <h4 className="font-medium text-sm mb-1">Description:</h4>
                              <p className="text-sm text-muted-foreground">{record.description}</p>
                            </div>
                          )}
                          
                          {record.findings && (
                            <div className="mb-3">
                              <h4 className="font-medium text-sm mb-1">Observations:</h4>
                              <p className="text-sm text-muted-foreground">{record.findings}</p>
                            </div>
                          )}
                          
                          {record.recommendations && (
                            <div>
                              <h4 className="font-medium text-sm mb-1">Recommandations:</h4>
                              <p className="text-sm text-muted-foreground">{record.recommendations}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="h-5 w-5 mr-2" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune prescription trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{prescription.medication_name}</h4>
                          <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                            {prescription.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Dosage:</span> {prescription.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Fréquence:</span> {prescription.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Durée:</span> {prescription.duration_days} jours
                          </div>
                          <div>
                            <span className="font-medium">Prescrit le:</span> {formatDate(prescription.prescribed_date)}
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm">{prescription.instructions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                Plans de traitement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatmentPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun plan de traitement trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatmentPlans.map((plan) => (
                    <Card key={plan.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{plan.title}</h4>
                          <div className="flex space-x-2">
                            <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                              {plan.status}
                            </Badge>
                            <Badge variant="outline">{plan.priority}</Badge>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Durée estimée:</span> {plan.estimated_duration_weeks} semaines
                          </div>
                          <div>
                            <span className="font-medium">Coût estimé:</span> €{plan.estimated_cost}
                          </div>
                          <div>
                            <span className="font-medium">Date de début:</span> {plan.start_date ? formatDate(plan.start_date) : 'Non définie'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {mode === 'dentist' && dentistId && patientProfile && (
          <>
            <TabsContent value="add-prescription">
              <PrescriptionManager
                appointmentId=""
                patientId={patientProfile.id}
                dentistId={dentistId}
              />
            </TabsContent>

            <TabsContent value="add-treatment">
              <TreatmentPlanManager
                appointmentId=""
                patientId={patientProfile.id}
                dentistId={dentistId}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* AI Consultation Dialog */}
      {showAIConsultation && patientProfile && dentistId && (
        <AIConversationDialog
          patientId={patientProfile.id}
          dentistId={dentistId}
          patientName={`${patientProfile.first_name} ${patientProfile.last_name}`}
          contextType="dentist_consultation"
          user={user}
        />
      )}
    </div>
  );
};