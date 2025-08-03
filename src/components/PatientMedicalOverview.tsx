import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  Pill, 
  FileText, 
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  User,
  UserCheck,
  Eye,
  Edit,
  Target
} from "lucide-react";
import { format } from "date-fns";
import type { User } from "@/types/common";

interface TreatmentPlan {
  id: string;
  plan_name: string;
  description?: string;
  diagnosis?: string;
  status: string;
  priority: string;
  estimated_duration?: string;
  estimated_cost?: number;
  start_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  dentist?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribed_date: string;
  status: string;
  created_at: string;
  dentist?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface PatientNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  created_at: string;
  dentist?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface MedicalRecord {
  id: string;
  title: string;
  description?: string;
  record_type: string;
  record_date: string;
  created_at: string;
  dentist?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface PatientMedicalOverviewProps {
  patientId: string;
  user: User;
}

export function PatientMedicalOverview({ patientId, user }: PatientMedicalOverviewProps) {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatientData();
  }, [patientId, fetchPatientData]);

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch treatment plans
      const { data: treatmentPlansData, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          dentist:dentists(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (treatmentPlansError) throw treatmentPlansError;

      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          dentist:dentists(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (prescriptionsError) throw prescriptionsError;

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('patient_notes')
        .select(`
          *,
          dentist:dentists(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch medical records
      const { data: medicalRecordsData, error: medicalRecordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          dentist:dentists(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (medicalRecordsError) throw medicalRecordsError;

      setTreatmentPlans(treatmentPlansData || []);
      setPrescriptions(prescriptionsData || []);
      setNotes(notesData || []);
      setMedicalRecords(medicalRecordsData || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load medical data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Loading medical data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-dental-primary" />
            <span>Medical Overview</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="treatment-plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="treatment-plans" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Treatment Plans ({treatmentPlans.length})</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center space-x-2">
            <Pill className="h-4 w-4" />
            <span>Prescriptions ({prescriptions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Notes ({notes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Medical Records ({medicalRecords.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatment-plans" className="space-y-4">
          {treatmentPlans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No treatment plans found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {treatmentPlans.map((plan) => (
                <Card key={plan.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created on {formatDate(plan.created_at)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status}
                        </Badge>
                        <Badge className={getPriorityColor(plan.priority)}>
                          {plan.priority}
                        </Badge>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-sm mb-3">{plan.description}</p>
                    )}

                    {plan.diagnosis && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground">Diagnosis:</p>
                        <p className="text-sm">{plan.diagnosis}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {plan.estimated_duration && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plan.estimated_duration}</span>
                        </div>
                      )}
                      {plan.estimated_cost && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">€{plan.estimated_cost}</span>
                        </div>
                      )}
                      {plan.start_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(plan.start_date)}</span>
                        </div>
                      )}
                    </div>

                    {plan.notes && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{plan.notes}</p>
                      </div>
                    )}

                    {plan.dentist && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Dr. {plan.dentist.profile?.first_name} {plan.dentist.profile?.last_name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No prescriptions found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{prescription.medication_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Prescribed on {formatDate(prescription.prescribed_date)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dosage:</p>
                        <p className="text-sm">{prescription.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Frequency:</p>
                        <p className="text-sm">{prescription.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration:</p>
                        <p className="text-sm">{prescription.duration}</p>
                      </div>
                    </div>

                    {prescription.instructions && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Instructions:</p>
                        <p className="text-sm">{prescription.instructions}</p>
                      </div>
                    )}

                    {prescription.dentist && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Dr. {prescription.dentist.profile?.first_name} {prescription.dentist.profile?.last_name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {notes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notes found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{note.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(note.created_at)} • {note.note_type}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {note.dentist && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Dr. {note.dentist.profile?.first_name} {note.dentist.profile?.last_name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No medical records found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <Card key={record.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{record.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.record_date)} • {record.record_type}
                        </p>
                      </div>
                    </div>

                    {record.description && (
                      <p className="text-sm mb-3">{record.description}</p>
                    )}

                    {record.dentist && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Dr. {record.dentist.profile?.first_name} {record.dentist.profile?.last_name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}