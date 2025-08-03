import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  ClipboardList, 
  FileText, 
  MessageSquare, 
  Calendar,
  Plus,
  Eye
} from "lucide-react";
import { Patient, Prescription, TreatmentPlan, MedicalRecord, PatientNote } from "@/types/dental";

interface EnhancedPatientOverviewProps {
  patient: Patient;
  prescriptions: Prescription[];
  treatmentPlans: TreatmentPlan[];
  medicalRecords: MedicalRecord[];
  patientNotes: PatientNote[];
  appointments: Appointment[];
  dentistId: string;
  onRefresh: () => void;
}

export function EnhancedPatientOverview({
  patient,
  prescriptions,
  treatmentPlans,
  medicalRecords,
  patientNotes,
  appointments,
  dentistId,
  onRefresh
}: EnhancedPatientOverviewProps) {
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const activeTreatmentPlans = treatmentPlans.filter(t => t.status === 'active');
  const recentNotes = patientNotes.slice(0, 3);
  const recentAppointments = appointments.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Patient Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{activePrescriptions.length}</div>
            <div className="text-sm text-muted-foreground">Active Prescriptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeTreatmentPlans.length}</div>
            <div className="text-sm text-muted-foreground">Active Treatment Plans</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{medicalRecords.length}</div>
            <div className="text-sm text-muted-foreground">Medical Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{patientNotes.length}</div>
            <div className="text-sm text-muted-foreground">Patient Notes</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-primary" />
            <span>Active Prescriptions</span>
            <Badge variant="outline">{activePrescriptions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No active prescriptions</p>
          ) : (
            <div className="space-y-3">
              {activePrescriptions.map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{prescription.medication_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {prescription.dosage} - {prescription.frequency}
                    </p>
                  </div>
                  <Badge variant="default">{prescription.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Treatment Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>Active Treatment Plans</span>
            <Badge variant="outline">{activeTreatmentPlans.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTreatmentPlans.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No active treatment plans</p>
          ) : (
            <div className="space-y-3">
              {activeTreatmentPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{plan.plan_name}</h4>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={plan.priority === 'high' ? 'destructive' : 'default'}>
                      {plan.priority}
                    </Badge>
                    <Badge variant="outline">{plan.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Recent Notes</span>
            <Badge variant="outline">{patientNotes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No notes found</p>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{note.title}</h4>
                    <Badge variant="outline">{note.note_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Recent Appointments</span>
            <Badge variant="outline">{appointments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No appointments found</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </h4>
                    <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                  </div>
                  <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}