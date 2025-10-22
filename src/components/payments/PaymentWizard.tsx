import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, CreditCard, ListOrdered, Mail, Settings, User } from 'lucide-react';

interface PaymentWizardProps {
  dentistId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AppointmentRef {
  id: string;
  appointment_date: string;
}

interface ItemInput {
  code?: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  tax_cents: number;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const PaymentWizard: React.FC<PaymentWizardProps> = ({ dentistId, isOpen, onClose }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>(1);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRef[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');

  const [items, setItems] = useState<ItemInput[]>([
    { description: '', quantity: 1, unit_price_cents: 0, tax_cents: 0 },
  ]);
  const [termsDueInDays, setTermsDueInDays] = useState<number>(14);
  const [reminderCadence, setReminderCadence] = useState<string>('3,7,14');
  const [channels, setChannels] = useState<{ email: boolean; copy: boolean }>({ email: true, copy: true });
  const [description, setDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [paymentLink, setPaymentLink] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    void fetchPatients();
  }, [isOpen, dentistId]);

  useEffect(() => {
    if (selectedPatient) {
      void fetchAppointmentsForPatient(selectedPatient.id);
    } else {
      setAppointments([]);
      setSelectedAppointmentId('');
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    // Load patients derived from appointments for this dentist
    const { data, error } = await supabase
      .from('appointments' as any)
      .select(`
        patient_id,
        profiles(id, first_name, last_name, email)
      `)
      .eq('dentist_id', dentistId)
      .not('profiles', 'is', null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' });
      return;
    }
    const unique: Record<string, PatientProfile> = {};
    (data || []).forEach((row: any) => {
      const p = row.profiles as PatientProfile | null;
      if (p && !unique[p.id]) unique[p.id] = p;
    });
    setPatients(Object.values(unique));
  };

  const fetchAppointmentsForPatient = async (patientId: string) => {
    const { data, error } = await supabase
      .from('appointments' as any)
      .select('id, appointment_date')
      .eq('dentist_id', dentistId)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    if (!error && data) setAppointments(data as unknown as AppointmentRef[]);
  };

  const subtotalCents = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity * it.unit_price_cents, 0);
  }, [items]);
  const taxCents = useMemo(() => items.reduce((sum, it) => sum + it.tax_cents, 0), [items]);
  const totalCents = useMemo(() => subtotalCents + taxCents, [subtotalCents, taxCents]);

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unit_price_cents: 0, tax_cents: 0 }]);
  };
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!selectedPatient) return;
    if (items.length === 0 || items.every(i => !i.description || i.quantity <= 0)) return;
    setCreating(true);
    try {
      const cadence = reminderCadence
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((n) => !Number.isNaN(n) && n > 0);
      const { data, error } = await supabase.functions.invoke('create-payment-request', {
        body: {
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          amount: totalCents, // fallback if server needs it
          description: description || `Dental services for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
          patient_email: selectedPatient.email,
          patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          appointment_id: selectedAppointmentId || undefined,
          items: items.map((i) => ({
            code: i.code,
            description: i.description,
            quantity: i.quantity,
            unit_price_cents: i.unit_price_cents,
            tax_cents: i.tax_cents,
          })),
          terms_due_in_days: termsDueInDays,
          reminder_cadence_days: cadence,
          channels: [channels.email ? 'email' : null, channels.copy ? 'link' : null].filter(Boolean),
          send_now: channels.email,
        },
      });
      if (error) throw error;
      const link = data?.payment_url as string | undefined;
      if (link) setPaymentLink(link);
      setStep(5);
      toast({ title: 'Payment request created', description: 'Share the link with the patient.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create payment request', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const resetStateAndClose = () => {
    setStep(1);
    setSelectedPatient(null);
    setAppointments([]);
    setSelectedAppointmentId('');
    setItems([{ description: '', quantity: 1, unit_price_cents: 0, tax_cents: 0 }]);
    setTermsDueInDays(14);
    setReminderCadence('3,7,14');
    setChannels({ email: true, copy: true });
    setDescription('');
    setPaymentLink('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetStateAndClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Create Payment Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Step indicators */}
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}><User className="h-4 w-4" />Patient</div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}><ListOrdered className="h-4 w-4" />Appointment</div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}><ListOrdered className="h-4 w-4" />Items</div>
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}><Settings className="h-4 w-4" />Terms</div>
            <div className={`flex items-center gap-2 ${step >= 5 ? 'text-primary' : 'text-muted-foreground'}`}><CheckCircle className="h-4 w-4" />Confirm</div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient">Select Patient</Label>
                <select
                  id="patient"
                  className="w-full p-2 border rounded-md"
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const p = patients.find((pp) => pp.id === e.target.value) || null;
                    setSelectedPatient(p);
                  }}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <Button disabled={!selectedPatient} onClick={() => setStep(2)}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Link Appointment (optional)</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                >
                  <option value="">No appointment</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>{new Date(a.appointment_date).toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="desc">Short Description</Label>
                <Input id="desc" placeholder="e.g., Cleaning and X-ray" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={!selectedPatient} onClick={() => setStep(3)}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {items.map((it, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Code</Label>
                        <Input value={it.code || ''} onChange={(e) => {
                          const v = e.target.value; setItems((prev) => prev.map((p, i) => i === idx ? { ...p, code: v } : p));
                        }} />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input type="number" min={1} value={it.quantity} onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value || 1));
                          setItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: v } : p));
                        }} />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea rows={2} value={it.description} onChange={(e) => {
                        const v = e.target.value; setItems((prev) => prev.map((p, i) => i === idx ? { ...p, description: v } : p));
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Unit Price (€)</Label>
                        <Input type="number" min={0} step="0.01" value={(it.unit_price_cents / 100).toString()} onChange={(e) => {
                          const euros = Number(e.target.value || 0); const cents = Math.round(euros * 100);
                          setItems((prev) => prev.map((p, i) => i === idx ? { ...p, unit_price_cents: Math.max(0, cents) } : p));
                        }} />
                      </div>
                      <div>
                        <Label>Tax (€)</Label>
                        <Input type="number" min={0} step="0.01" value={(it.tax_cents / 100).toString()} onChange={(e) => {
                          const euros = Number(e.target.value || 0); const cents = Math.round(euros * 100);
                          setItems((prev) => prev.map((p, i) => i === idx ? { ...p, tax_cents: Math.max(0, cents) } : p));
                        }} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Line total: €{((it.quantity * it.unit_price_cents + it.tax_cents)/100).toFixed(2)}</div>
                      {items.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeItem(idx)}>Remove</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-between">
                <Button variant="outline" onClick={addItem}>Add Item</Button>
                <div className="text-right text-sm">
                  <div>Subtotal: €{(subtotalCents/100).toFixed(2)}</div>
                  <div>Tax: €{(taxCents/100).toFixed(2)}</div>
                  <div className="font-semibold">Total: €{(totalCents/100).toFixed(2)}</div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} disabled={items.some(i => !i.description || i.quantity <= 0)}>Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Due in (days)</Label>
                  <Input type="number" min={1} value={termsDueInDays} onChange={(e) => setTermsDueInDays(Math.max(1, Number(e.target.value || 1)))} />
                </div>
                <div>
                  <Label>Reminder cadence (days, comma-separated)</Label>
                  <Input value={reminderCadence} onChange={(e) => setReminderCadence(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={channels.email} onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))} />
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email now</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={channels.copy} onChange={(e) => setChannels((c) => ({ ...c, copy: e.target.checked }))} />
                  <span>Copy link</span>
                </label>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleCreate} disabled={!selectedPatient || creating}>{creating ? 'Creating...' : 'Create'}</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="text-sm">Payment request created successfully.</div>
              {paymentLink && (
                <div className="space-y-2">
                  <Label>Shareable link</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={paymentLink} />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentLink);
                        toast({ title: 'Copied', description: 'Payment link copied to clipboard' });
                      }}
                    >Copy</Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={resetStateAndClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentWizard;

