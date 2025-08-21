
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  FileText, 
  Pill, 
  CreditCard, 
  Calendar,
  User,
  Clock,
  X
} from 'lucide-react';

interface AppointmentCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    patient_id: string;
    dentist_id: string;
    appointment_date: string;
    reason?: string;
    patient_name?: string;
  };
  onCompleted: () => void;
}

interface TreatmentItem {
  id: string;
  name: string;
  cost: number;
  quantity: number;
}

interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export function AppointmentCompletionDialog({
  open,
  onOpenChange,
  appointment,
  onCompleted
}: AppointmentCompletionDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [createInvoice, setCreateInvoice] = useState(true);

  // Patient info
  const [patientInfo, setPatientInfo] = useState<{name: string; email: string} | null>(null);

  useEffect(() => {
    if (open && appointment.patient_id) {
      fetchPatientInfo();
    }
  }, [open, appointment.patient_id]);

  const fetchPatientInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', appointment.patient_id)
        .single();

      if (error) throw error;
      
      setPatientInfo({
        name: `${data.first_name} ${data.last_name}`,
        email: data.email
      });
    } catch (error) {
      console.error('Error fetching patient info:', error);
    }
  };

  const addTreatment = () => {
    const newTreatment: TreatmentItem = {
      id: Math.random().toString(),
      name: '',
      cost: 0,
      quantity: 1
    };
    setTreatments([...treatments, newTreatment]);
  };

  const updateTreatment = (id: string, field: keyof TreatmentItem, value: string | number) => {
    setTreatments(treatments.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const removeTreatment = (id: string) => {
    setTreatments(treatments.filter(t => t.id !== id));
  };

  const addPrescription = () => {
    const newPrescription: PrescriptionItem = {
      id: Math.random().toString(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    setPrescriptions([...prescriptions, newPrescription]);
  };

  const updatePrescription = (id: string, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions(prescriptions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const totalCost = treatments.reduce((sum, t) => sum + (t.cost * t.quantity), 0);

  const handleComplete = async () => {
    if (!clinicalNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please add clinical notes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Update appointment status
      await supabase
        .from('appointments')
        .update({
          status: 'completed',
          treatment_completed_at: new Date().toISOString(),
          notes: clinicalNotes
        })
        .eq('id', appointment.id);

      // 2. Add treatments
      if (treatments.length > 0) {
        const treatmentData = treatments
          .filter(t => t.name.trim())
          .map(t => ({
            appointment_id: appointment.id,
            code: `TREAT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            description: t.name,
            quantity: t.quantity,
            tariff: t.cost,
            patient_share: t.cost,
            mutuality_share: 0,
            vat_amount: 0
          }));

        if (treatmentData.length > 0) {
          await supabase.from('appointment_treatments').insert(treatmentData);
        }
      }

      // 3. Add prescriptions
      if (prescriptions.length > 0) {
        const prescriptionData = prescriptions
          .filter(p => p.medication.trim())
          .map(p => ({
            patient_id: appointment.patient_id,
            dentist_id: appointment.dentist_id,
            appointment_id: appointment.id,
            medication_name: p.medication,
            dosage: p.dosage,
            frequency: p.frequency,
            duration_days: p.duration ? parseInt(p.duration) : null,
            instructions: p.instructions,
            status: 'active',
            prescribed_date: new Date().toISOString()
          }));

        if (prescriptionData.length > 0) {
          await supabase.from('prescriptions').insert(prescriptionData);
        }
      }

      // 4. Create invoice if requested
      if (createInvoice && totalCost > 0) {
        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            dentist_id: appointment.dentist_id,
            total_amount_cents: Math.round(totalCost * 100),
            patient_amount_cents: Math.round(totalCost * 100),
            mutuality_amount_cents: 0,
            vat_amount_cents: 0,
            status: 'draft',
            claim_status: 'to_be_submitted'
          })
          .select()
          .single();

        if (invoice) {
          // Add invoice items
          const invoiceItems = treatments
            .filter(t => t.name.trim())
            .map(t => ({
              invoice_id: invoice.id,
              code: `TREAT-${t.id}`,
              description: t.name,
              quantity: t.quantity,
              tariff_cents: Math.round(t.cost * 100),
              patient_cents: Math.round(t.cost * 100),
              mutuality_cents: 0,
              vat_cents: 0
            }));

          if (invoiceItems.length > 0) {
            await supabase.from('invoice_items').insert(invoiceItems);
          }
        }
      }

      // 5. Schedule follow-up if requested
      if (followUpDate) {
        await supabase
          .from('appointments')
          .insert({
            patient_id: appointment.patient_id,
            dentist_id: appointment.dentist_id,
            appointment_date: new Date(followUpDate).toISOString(),
            reason: 'Follow-up appointment',
            status: 'pending',
            urgency: 'medium'
          });
      }

      toast({
        title: "Appointment Completed",
        description: "All treatment details have been saved successfully.",
      });

      onCompleted();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to complete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Clinical Notes', icon: FileText },
    { number: 2, title: 'Treatments', icon: CheckCircle },
    { number: 3, title: 'Prescriptions', icon: Pill },
    { number: 4, title: 'Summary & Invoice', icon: CreditCard }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Complete Appointment
          </DialogTitle>
          
          {/* Patient Info Bar */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{patientInfo?.name || appointment.patient_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {new Date(appointment.appointment_date).toLocaleString()}
              </span>
            </div>
            {appointment.reason && (
              <Badge variant="outline">{appointment.reason}</Badge>
            )}
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                ${currentStep >= step.number 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground text-muted-foreground'
                }
              `}>
                <step.icon className="h-4 w-4" />
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium">{step.title}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-4 transition-colors
                  ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Clinical Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter clinical notes, observations, and treatment outcomes..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={6}
                  className="min-h-32"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClinicalNotes(prev => prev + '\n• No complications observed')}
                  >
                    No Complications
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClinicalNotes(prev => prev + '\n• Patient tolerated procedure well')}
                  >
                    Well Tolerated
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClinicalNotes(prev => prev + '\n• Follow-up recommended in 2 weeks')}
                  >
                    Follow-up Needed
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Treatments Performed
                  </div>
                  <Button onClick={addTreatment} size="sm">
                    Add Treatment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Input
                          placeholder="Treatment description"
                          value={treatment.name}
                          onChange={(e) => updateTreatment(treatment.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={treatment.quantity}
                          onChange={(e) => updateTreatment(treatment.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Cost €"
                          value={treatment.cost}
                          onChange={(e) => updateTreatment(treatment.id, 'cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        €{(treatment.cost * treatment.quantity).toFixed(2)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTreatment(treatment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {treatments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No treatments added yet. Click "Add Treatment" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Prescriptions
                  </div>
                  <Button onClick={addPrescription} size="sm">
                    Add Prescription
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Medication</label>
                            <Input
                              placeholder="e.g., Amoxicillin"
                              value={prescription.medication}
                              onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Dosage</label>
                            <Input
                              placeholder="e.g., 500mg"
                              value={prescription.dosage}
                              onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Frequency</label>
                            <Input
                              placeholder="e.g., 3 times daily"
                              value={prescription.frequency}
                              onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Duration (days)</label>
                            <Input
                              placeholder="e.g., 7"
                              value={prescription.duration}
                              onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium">Instructions</label>
                            <Input
                              placeholder="Special instructions for patient"
                              value={prescription.instructions}
                              onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => removePrescription(prescription.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {prescriptions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No prescriptions added. Click "Add Prescription" if needed.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Treatment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Clinical Notes:</h4>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {clinicalNotes || 'No notes added'}
                      </div>
                    </div>
                    
                    {treatments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Treatments:</h4>
                        <div className="space-y-2">
                          {treatments.filter(t => t.name.trim()).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 border rounded">
                              <span>{t.name} × {t.quantity}</span>
                              <span className="font-medium">€{(t.cost * t.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2 border-t font-semibold">
                            <span>Total</span>
                            <span>€{totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {prescriptions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Prescriptions:</h4>
                        <div className="space-y-2">
                          {prescriptions.filter(p => p.medication.trim()).map(p => (
                            <div key={p.id} className="p-2 border rounded text-sm">
                              <strong>{p.medication}</strong> - {p.dosage}, {p.frequency}
                              {p.duration && ` for ${p.duration} days`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="createInvoice"
                          checked={createInvoice}
                          onChange={(e) => setCreateInvoice(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="createInvoice" className="text-sm">
                          Create invoice for treatments ({totalCost > 0 ? `€${totalCost.toFixed(2)}` : 'No cost'})
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Schedule Follow-up (optional)
                        </label>
                        <Input
                          type="datetime-local"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {currentStep < 4 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={loading || !clinicalNotes.trim()}
              >
                {loading ? 'Completing...' : 'Complete Appointment'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
