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
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { NotificationService } from '@/lib/notificationService';

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
    if (treatments.length === 0) {
      toast({
        title: "No treatments added",
        description: "Please add at least one treatment before completing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
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

      // 3. Create invoice if payment received
      if (paymentReceived && totalAmount > 0) {
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
      }

      // 4. Mark appointment as completed
      await supabase
        .from('appointments')
        .update({
          status: 'completed',
          treatment_completed_at: new Date().toISOString(),
          consultation_notes: consultationNotes || notes || null
        })
        .eq('id', appointment.id);

      // 5. Schedule follow-up if needed
      if (followUpNeeded && followUpDate) {
        await supabase.from('appointments').insert({
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
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    {appointment.patient?.first_name} {appointment.patient?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.patient?.email}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    {format(new Date(appointment.appointment_date), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.appointment_date), 'p')}
                  </p>
                </div>
              </div>
              
              {appointment.reason && (
                <>
                  <Separator />
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Reason for visit</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <currentStepData.icon className="h-5 w-5 text-primary" />
            <span>Complete Appointment - {currentStepData.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
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