import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  FileText, 
  DollarSign, 
  Calendar,
  ArrowRight,
  ArrowLeft,
  User,
  Clock,
  Pill,
  ClipboardList,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { NotificationService } from '@/lib/notificationService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppointmentCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    patient_id: string;
    dentist_id: string;
    appointment_date: string;
    reason?: string;
    patient?: {
      first_name: string;
      last_name: string;
      email?: string;
    };
  };
  onCompleted: () => void;
}

interface Treatment {
  id: string;
  name: string;
  tooth?: string;
  price: number;
}

const steps = [
  { id: 'overview', title: 'Overview', icon: User },
  { id: 'treatments', title: 'Treatments', icon: FileText },
  { id: 'notes', title: 'Notes', icon: FileText },
  { id: 'prescriptions', title: 'Prescriptions', icon: Pill },
  { id: 'treatment-plan', title: 'Treatment Plan', icon: ClipboardList },
  { id: 'billing', title: 'Billing', icon: DollarSign },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 }
] as const;

export function AppointmentCompletionDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onCompleted 
}: AppointmentCompletionDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [notes, setNotes] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Array<{
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState<string | null>(null);
  const [linkToTreatmentPlan, setLinkToTreatmentPlan] = useState(false);
  const [createNewTreatmentPlan, setCreateNewTreatmentPlan] = useState(false);
  const [newTreatmentPlanForm, setNewTreatmentPlanForm] = useState({
    title: '',
    description: '',
    diagnosis: '',
    priority: 'normal',
    estimated_cost: '',
    estimated_duration_weeks: ''
  });

  // Fetch treatment plans on mount
  useEffect(() => {
    const fetchTreatmentPlans = async () => {
      const { data } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .eq('dentist_id', appointment.dentist_id)
        .eq('status', 'active');
      
      if (data) {
        setTreatmentPlans(data);
      }
    };
    
    if (open) {
      fetchTreatmentPlans();
    }
  }, [open, appointment]);

  // Auto-enable treatment plan link if plans available
  useEffect(() => {
    if (open && treatmentPlans.length > 0) {
      setLinkToTreatmentPlan(true);
    }
  }, [open, treatmentPlans.length]);

  // Calculated values
  const totalAmount = treatments.reduce((sum, treatment) => sum + treatment.price, 0);
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Quick treatment options
  const quickTreatments = [
    { name: 'Routine Cleaning', price: 80 },
    { name: 'Dental Examination', price: 50 },
    { name: 'X-Ray', price: 35 },
    { name: 'Filling', price: 120 },
    { name: 'Tooth Extraction', price: 150 },
    { name: 'Root Canal', price: 400 },
  ];

  const addTreatment = (treatment: { name: string; price: number }) => {
    const newTreatment: Treatment = {
      id: `${Date.now()}-${Math.random()}`,
      name: treatment.name,
      price: treatment.price
    };
    setTreatments(prev => [...prev, newTreatment]);
  };

  const addCustomTreatment = () => {
    const name = prompt('Treatment name:');
    const priceStr = prompt('Price (€):');
    if (name && priceStr) {
      const price = parseFloat(priceStr);
      if (!isNaN(price)) {
        addTreatment({ name, price });
      }
    }
  };

  const removeTreatment = (id: string) => {
    setTreatments(prev => prev.filter(t => t.id !== id));
  };

  const updateTreatmentPrice = (id: string, newPrice: number) => {
    setTreatments(prev => prev.map(t => 
      t.id === id ? { ...t, price: newPrice } : t
    ));
  };

  const updateTreatmentTooth = (id: string, tooth: string) => {
    setTreatments(prev => prev.map(t => 
      t.id === id ? { ...t, tooth } : t
    ));
  };

  const addPrescription = () => {
    setPrescriptions(prev => [...prev, {
      id: `rx-${Date.now()}`,
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const updatePrescription = (id: string, field: string, value: string) => {
    setPrescriptions(prev => prev.map(rx => 
      rx.id === id ? { ...rx, [field]: value } : rx
    ));
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prev => prev.filter(rx => rx.id !== id));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Generate AI reason based on consultation notes and treatments
      let aiGeneratedReason = appointment.reason;
      try {
        const { data: reasonData, error: reasonError } = await supabase.functions.invoke(
          'appointment-ai-assistant',
          {
            body: {
              action: 'generate_reason',
              appointmentData: {
                consultation_notes: consultationNotes || notes,
                notes: notes,
                treatments: treatments,
              },
            },
          }
        );

        if (!reasonError && reasonData?.reason) {
          aiGeneratedReason = reasonData.reason;
        }
      } catch (error) {
        console.error('Error generating AI reason:', error);
        // Continue with existing reason if AI generation fails
      }
      // 1. Save treatment records as notes (since appointment_treatments table doesn't exist)
      if (treatments.length > 0) {
        const treatmentNotes = treatments.map(treatment => 
          `Treatment: ${treatment.name}${treatment.tooth ? ` (Tooth: ${treatment.tooth})` : ''} - €${treatment.price.toFixed(2)}`
        ).join('\n');
        
        await supabase.from('notes').insert({
          patient_id: appointment.patient_id,
          title: `Appointment Treatments - ${format(new Date(appointment.appointment_date), 'PPP')}`,
          content: treatmentNotes,
          note_type: 'treatment',
          created_by: appointment.dentist_id
        });
      }

      // 2. Save consultation notes
      if (notes.trim() || consultationNotes.trim()) {
        await supabase.from('notes').insert({
          patient_id: appointment.patient_id,
          title: `Consultation Notes - ${format(new Date(appointment.appointment_date), 'PPP')}`,
          content: consultationNotes.trim() || notes.trim(),
          note_type: 'consultation',
          created_by: appointment.dentist_id
        });
      }

      // 3. Create invoice if payment received, or payment request if not
      if (totalAmount > 0) {
        if (paymentReceived) {
          // Payment received - create invoice
          const { data: invoice } = await supabase
            .from('invoices')
            .insert({
              appointment_id: appointment.id,
              patient_id: appointment.patient_id,
              dentist_id: appointment.dentist_id,
              total_amount_cents: Math.round(totalAmount * 100),
              patient_amount_cents: Math.round(totalAmount * 100),
              mutuality_amount_cents: 0,
              vat_amount_cents: 0,
              status: 'paid',
              claim_status: 'to_be_submitted'
            })
            .select()
            .single();

          // Add invoice items for treatments
          const invoiceItems = treatments.map(treatment => ({
            invoice_id: invoice.id,
            code: `TREAT-${treatment.name.replace(/\s+/g, '-').toUpperCase()}`,
            description: treatment.name,
            quantity: 1,
            tariff_cents: Math.round(treatment.price * 100),
            mutuality_cents: 0,
            patient_cents: Math.round(treatment.price * 100),
            vat_cents: 0
          }));
          
          if (invoiceItems.length > 0) {
            await supabase.from('invoice_items').insert(invoiceItems);
          }
        } else {
          // Payment not received - create payment request
          const { data: patientProfile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', appointment.patient_id)
            .single();

          if (patientProfile?.email) {
            const treatmentDescription = treatments.map(t => 
              `${t.name}${t.tooth ? ` (Tooth ${t.tooth})` : ''}`
            ).join(', ');

            try {
              const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
                'create-payment-request',
                {
                  body: {
                    patient_id: appointment.patient_id,
                    dentist_id: appointment.dentist_id,
                    amount: Math.round(totalAmount * 100),
                    description: `Appointment on ${format(new Date(appointment.appointment_date), 'PPP')} - ${treatmentDescription}`,
                    patient_email: patientProfile.email,
                    send_now: true,
                    channels: ['email']
                  }
                }
              );

              if (paymentError) {
                console.error('Error creating payment request:', paymentError);
                toast({
                  title: "Payment Request Failed",
                  description: "Could not send payment request to patient. You can create one manually later.",
                  variant: "destructive",
                });
              } else {
                console.log('✅ Payment request created and sent:', paymentData);
              }
            } catch (error) {
              console.error('Failed to create payment request:', error);
            }
          }
        }
      }

      // 4. Save prescriptions
      if (prescriptions.length > 0) {
        const prescriptionData = prescriptions.map(rx => ({
          patient_id: appointment.patient_id,
          dentist_id: appointment.dentist_id,
          medication_name: rx.medication,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration: rx.duration,
          instructions: rx.instructions,
          prescribed_date: new Date().toISOString(),
          status: 'active'
        }));
        
        await supabase.from('prescriptions').insert(prescriptionData);
      }

      // 5. Create new treatment plan or link to existing one
      let treatmentPlanId = selectedTreatmentPlan;
      
      if (createNewTreatmentPlan && newTreatmentPlanForm.title.trim()) {
        const { data: newPlan, error: planError } = await supabase
          .from('treatment_plans')
          .insert({
            patient_id: appointment.patient_id,
            dentist_id: appointment.dentist_id,
            title: newTreatmentPlanForm.title,
            description: newTreatmentPlanForm.description || null,
            diagnosis: newTreatmentPlanForm.diagnosis || null,
            priority: newTreatmentPlanForm.priority,
            estimated_cost: newTreatmentPlanForm.estimated_cost ? parseFloat(newTreatmentPlanForm.estimated_cost) : null,
            estimated_duration_weeks: newTreatmentPlanForm.estimated_duration_weeks ? parseInt(newTreatmentPlanForm.estimated_duration_weeks) : null,
            status: 'active',
            start_date: new Date().toISOString()
          })
          .select()
          .single();
        
        if (planError) {
          console.error('Error creating treatment plan:', planError);
        } else if (newPlan) {
          treatmentPlanId = newPlan.id;
        }
      }
      
      if (treatmentPlanId) {
        await supabase
          .from('appointments')
          .update({ treatment_plan_id: treatmentPlanId })
          .eq('id', appointment.id);
      }

      // 6. Mark appointment as completed
      await supabase
        .from('appointments')
        .update({
          status: 'completed',
          reason: aiGeneratedReason,
          consultation_notes: consultationNotes || notes || null
        })
        .eq('id', appointment.id);

      // 5. Schedule follow-up if needed with email notification
      if (followUpNeeded && followUpDate) {
        const { createAppointmentWithNotification } = await import('@/hooks/useAppointments');
        await createAppointmentWithNotification({
          patient_id: appointment.patient_id,
          dentist_id: appointment.dentist_id,
          appointment_date: new Date(followUpDate).toISOString(),
          reason: 'Follow-up appointment',
          status: 'confirmed',
          duration_minutes: 30
        });
      }

      // 6. Send email notification to patient with appointment details
      try {
        const { data: patientProfile } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .eq('id', appointment.patient_id)
          .single();

        if (patientProfile?.user_id && patientProfile?.email) {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px;">Appointment Completed</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
                <p><strong>Date:</strong> ${format(new Date(appointment.appointment_date), 'PPP')}</p>
                <p><strong>Time:</strong> ${format(new Date(appointment.appointment_date), 'p')}</p>
                ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
              </div>

              ${treatments.length > 0 ? `
                <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Treatments Provided</h3>
                  ${treatments.map(treatment => `
                    <div style="border-bottom: 1px solid #f0f0f0; padding: 10px 0;">
                      <div style="display: flex; justify-content: space-between;">
                        <span><strong>${treatment.name}</strong>${treatment.tooth ? ` (Tooth: ${treatment.tooth})` : ''}</span>
                        <span>€${treatment.price.toFixed(2)}</span>
                      </div>
                    </div>
                  `).join('')}
                  <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                      <span>Total Amount:</span>
                      <span>€${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${(notes.trim() || consultationNotes.trim()) ? `
                <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Clinical Notes</h3>
                  <p style="white-space: pre-wrap;">${consultationNotes.trim() || notes.trim()}</p>
                </div>
              ` : ''}

              ${paymentReceived ? `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <h4 style="color: #155724; margin-top: 0;">✅ Payment Received</h4>
                  <p style="color: #155724; margin: 0;">Payment of €${totalAmount.toFixed(2)} has been received and processed.</p>
                </div>
              ` : ''}

              ${followUpNeeded && followUpDate ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <h4 style="color: #856404; margin-top: 0;">📅 Follow-up Scheduled</h4>
                  <p style="color: #856404; margin: 0;">A follow-up appointment has been scheduled for ${format(new Date(followUpDate), 'PPP p')}.</p>
                </div>
              ` : ''}

              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 30px; border-top: 1px solid #e5e5e5;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                  Thank you for your visit! If you have any questions about your treatment or need to schedule another appointment, 
                  please don't hesitate to contact our office.
                </p>
              </div>
            </div>
          `;

          await NotificationService.sendEmailNotification(
            patientProfile.user_id,
            'Appointment Completed - Treatment Summary',
            emailContent,
            'appointment',
            true,
            {
              email: patientProfile.email,
              dentistId: appointment.dentist_id,
              appointmentId: appointment.id,
              isSystemNotification: false
            }
          );

          console.log('✅ Email sent to patient:', patientProfile.email);
        }
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
        // Don't block the completion if email fails
      }

      toast({
        title: "Appointment completed successfully",
        description: `${treatments.length} treatment(s) recorded${paymentReceived ? ', payment received' : ''}${followUpNeeded ? ', follow-up scheduled' : ''}. Patient notified by email.`,
      });

      onCompleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error completing appointment",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-6 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {appointment.patient?.first_name} {appointment.patient?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.patient?.email || 'No email provided'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-base">
                      {format(new Date(appointment.appointment_date), 'EEEE, MMMM do, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.appointment_date), 'h:mm a')}
                    </p>
                  </div>
                </div>

                {appointment.reason && (
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-base">Reason for visit</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'treatments':
        return (
          <div className="space-y-4">
            {/* Quick treatments */}
            <div>
              <Label className="text-base font-semibold">Quick Add Treatments</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {quickTreatments.map((treatment) => (
                  <Button
                    key={treatment.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addTreatment(treatment)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div>
                      <p className="font-medium">{treatment.name}</p>
                      <p className="text-xs text-muted-foreground">€{treatment.price}</p>
                    </div>
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomTreatment}
                className="mt-2 w-full"
              >
                + Custom Treatment
              </Button>
            </div>

            {/* Selected treatments */}
            {treatments.length > 0 && (
              <div>
                <Label className="text-base font-semibold">Selected Treatments</Label>
                <div className="space-y-2 mt-2">
                  {treatments.map((treatment) => (
                    <Card key={treatment.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <p className="font-medium">{treatment.name}</p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Tooth (e.g., 16)"
                                value={treatment.tooth || ''}
                                onChange={(e) => updateTreatmentTooth(treatment.id, e.target.value)}
                                className="w-24"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Price"
                                value={treatment.price}
                                onChange={(e) => updateTreatmentPrice(treatment.id, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTreatment(treatment.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card className="mt-4 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-lg font-bold text-primary">
                        €{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="consultation-notes" className="text-base font-semibold">
                Clinical Notes
              </Label>
              <Textarea
                id="consultation-notes"
                placeholder="Record clinical findings, treatment details, patient response..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>
            
            <div>
              <Label htmlFor="general-notes" className="text-base font-semibold">
                Additional Notes
              </Label>
              <Textarea
                id="general-notes"
                placeholder="Any additional observations or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow-up"
                checked={followUpNeeded}
                onChange={(e) => setFollowUpNeeded(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="follow-up">Schedule follow-up appointment</Label>
            </div>

            {followUpNeeded && (
              <div>
                <Label htmlFor="follow-up-date">Follow-up Date</Label>
                <Input
                  id="follow-up-date"
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );

      case 'prescriptions':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Prescriptions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addPrescription}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Prescription
              </Button>
            </div>

            {prescriptions.length === 0 ? (
              <Card className="p-8 text-center bg-muted/30">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No prescriptions added</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Click "Add Prescription" to prescribe medication</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <Card key={rx.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Medication Details</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrescription(rx.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`rx-medication-${rx.id}`}>Medication Name</Label>
                          <Input
                            id={`rx-medication-${rx.id}`}
                            placeholder="e.g., Amoxicillin"
                            value={rx.medication}
                            onChange={(e) => updatePrescription(rx.id, 'medication', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rx-dosage-${rx.id}`}>Dosage</Label>
                          <Input
                            id={`rx-dosage-${rx.id}`}
                            placeholder="e.g., 500mg"
                            value={rx.dosage}
                            onChange={(e) => updatePrescription(rx.id, 'dosage', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rx-frequency-${rx.id}`}>Frequency</Label>
                          <Input
                            id={`rx-frequency-${rx.id}`}
                            placeholder="e.g., 3 times daily"
                            value={rx.frequency}
                            onChange={(e) => updatePrescription(rx.id, 'frequency', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rx-duration-${rx.id}`}>Duration</Label>
                          <Input
                            id={`rx-duration-${rx.id}`}
                            placeholder="e.g., 7 days"
                            value={rx.duration}
                            onChange={(e) => updatePrescription(rx.id, 'duration', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`rx-instructions-${rx.id}`}>Instructions</Label>
                        <Textarea
                          id={`rx-instructions-${rx.id}`}
                          placeholder="Special instructions for the patient..."
                          value={rx.instructions}
                          onChange={(e) => updatePrescription(rx.id, 'instructions', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'treatment-plan':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Treatment Plan</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new treatment plan or link to an existing one
              </p>
            </div>

            {/* Create New Treatment Plan */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-treatment-plan"
                checked={createNewTreatmentPlan}
                onChange={(e) => {
                  setCreateNewTreatmentPlan(e.target.checked);
                  if (e.target.checked) setLinkToTreatmentPlan(false);
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="create-treatment-plan">Create new treatment plan</Label>
            </div>

            {createNewTreatmentPlan && (
              <Card className="p-4 space-y-3">
                <div>
                  <Label htmlFor="plan-title">Plan Title *</Label>
                  <Input
                    id="plan-title"
                    placeholder="e.g., Full Mouth Restoration"
                    value={newTreatmentPlanForm.title}
                    onChange={(e) => setNewTreatmentPlanForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea
                    id="plan-description"
                    placeholder="Describe the treatment plan..."
                    value={newTreatmentPlanForm.description}
                    onChange={(e) => setNewTreatmentPlanForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="plan-diagnosis">Diagnosis</Label>
                    <Input
                      id="plan-diagnosis"
                      placeholder="e.g., Multiple caries"
                      value={newTreatmentPlanForm.diagnosis}
                      onChange={(e) => setNewTreatmentPlanForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-priority">Priority</Label>
                    <Select
                      value={newTreatmentPlanForm.priority}
                      onValueChange={(value) => setNewTreatmentPlanForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plan-cost">Estimated Cost (€)</Label>
                    <Input
                      id="plan-cost"
                      type="number"
                      placeholder="0.00"
                      value={newTreatmentPlanForm.estimated_cost}
                      onChange={(e) => setNewTreatmentPlanForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="plan-duration">Duration (weeks)</Label>
                    <Input
                      id="plan-duration"
                      type="number"
                      placeholder="0"
                      value={newTreatmentPlanForm.estimated_duration_weeks}
                      onChange={(e) => setNewTreatmentPlanForm(prev => ({ ...prev, estimated_duration_weeks: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Link to Existing Treatment Plan */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="link-treatment-plan"
                checked={linkToTreatmentPlan}
                onChange={(e) => {
                  setLinkToTreatmentPlan(e.target.checked);
                  if (e.target.checked) setCreateNewTreatmentPlan(false);
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="link-treatment-plan">Link to existing treatment plan</Label>
            </div>

            {linkToTreatmentPlan && (
              <div className="space-y-3">
                {treatmentPlans.length === 0 ? (
                  <Card className="p-6 text-center bg-muted/30">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active treatment plans found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      Create a new treatment plan above
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Treatment Plan</Label>
                    {treatmentPlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedTreatmentPlan === plan.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTreatmentPlan(plan.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{plan.title || 'Untitled Treatment Plan'}</h4>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{plan.status}</Badge>
                              {plan.estimated_cost && (
                                <span className="text-sm text-muted-foreground">
                                  Est. Cost: €{plan.estimated_cost}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedTreatmentPlan === plan.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!linkToTreatmentPlan && !createNewTreatmentPlan && (
              <Card className="p-6 text-center bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  This appointment will be recorded as a standalone visit
                </p>
              </Card>
            )}
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Treatment Summary</h3>
                {treatments.length > 0 ? (
                  <div className="space-y-2">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          {treatment.tooth && (
                            <p className="text-sm text-muted-foreground">Tooth: {treatment.tooth}</p>
                          )}
                        </div>
                        <span className="font-semibold">€{treatment.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">€{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No treatments added</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="payment-received"
                    checked={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="payment-received" className="font-semibold">
                    Payment received (€{totalAmount.toFixed(2)})
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Check this if the patient has paid for the treatment
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Ready to Complete</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ {treatments.length} treatment(s) will be recorded</p>
                {(notes.trim() || consultationNotes.trim()) && (
                  <p>✓ Clinical notes will be saved</p>
                )}
                {paymentReceived && (
                  <p>✓ Payment of €{totalAmount.toFixed(2)} will be recorded</p>
                )}
                {followUpNeeded && followUpDate && (
                  <p>✓ Follow-up appointment will be scheduled</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                The appointment status will be changed to "Completed" and cannot be undone.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>Complete Appointment - {currentStepData.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground font-medium">Step {currentStep + 1} of {steps.length}</span>
            <span className="font-medium text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        {/* Step content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={loading || treatments.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Complete Appointment
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}