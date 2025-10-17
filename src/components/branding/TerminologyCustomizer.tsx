import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Type, Save } from 'lucide-react';
import { getTerminology } from '@/lib/industryTerminology';

interface TerminologyCustomizerProps {
  organizationId: string;
}

export const TerminologyCustomizer: React.FC<TerminologyCustomizerProps> = ({
  organizationId,
}) => {
  const queryClient = useQueryClient();
  const [terminology, setTerminology] = useState({
    provider: '',
    providers: '',
    client: '',
    clients: '',
    appointment: '',
    appointments: '',
    service: '',
    services: '',
    payment: '',
    payments: '',
  });

  const { data: settings } = useQuery({
    queryKey: ['organization_settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*, organizations(industry_type)')
        .eq('organization_id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const defaultTerms = getTerminology(settings.organizations?.industry_type as any);
      const customTerms = settings.terminology as any || {};
      
      setTerminology({
        provider: customTerms.provider || defaultTerms.provider,
        providers: customTerms.providers || defaultTerms.providers,
        client: customTerms.client || defaultTerms.client,
        clients: customTerms.clients || defaultTerms.clients,
        appointment: customTerms.appointment || defaultTerms.appointment,
        appointments: customTerms.appointments || defaultTerms.appointments,
        service: customTerms.service || defaultTerms.service,
        services: customTerms.services || defaultTerms.services,
        payment: customTerms.payment || defaultTerms.payment,
        payments: customTerms.payments || defaultTerms.payments,
      });
    }
  }, [settings]);

  const updateTerminology = useMutation({
    mutationFn: async (terms: typeof terminology) => {
      const { error } = await supabase
        .from('organization_settings')
        .update({ terminology: terms })
        .eq('organization_id', organizationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_settings', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['industry_terminology'] });
      toast.success('Terminology updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update terminology: ' + error.message);
    },
  });

  const handleSave = () => {
    updateTerminology.mutate(terminology);
  };

  const handleReset = () => {
    if (settings?.organizations?.industry_type) {
      const defaultTerms = getTerminology(settings.organizations.industry_type as any);
      setTerminology(defaultTerms);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              <CardTitle>Custom Terminology</CardTitle>
            </div>
            <CardDescription>
              Customize the terms used throughout your application
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider (Singular)</Label>
            <Input
              id="provider"
              value={terminology.provider}
              onChange={(e) => setTerminology({ ...terminology, provider: e.target.value })}
              placeholder="e.g., Doctor, Trainer, Consultant"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="providers">Providers (Plural)</Label>
            <Input
              id="providers"
              value={terminology.providers}
              onChange={(e) => setTerminology({ ...terminology, providers: e.target.value })}
              placeholder="e.g., Doctors, Trainers, Consultants"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client">Client (Singular)</Label>
            <Input
              id="client"
              value={terminology.client}
              onChange={(e) => setTerminology({ ...terminology, client: e.target.value })}
              placeholder="e.g., Patient, Member, Client"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clients">Clients (Plural)</Label>
            <Input
              id="clients"
              value={terminology.clients}
              onChange={(e) => setTerminology({ ...terminology, clients: e.target.value })}
              placeholder="e.g., Patients, Members, Clients"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appointment">Appointment (Singular)</Label>
            <Input
              id="appointment"
              value={terminology.appointment}
              onChange={(e) => setTerminology({ ...terminology, appointment: e.target.value })}
              placeholder="e.g., Appointment, Session, Meeting"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointments">Appointments (Plural)</Label>
            <Input
              id="appointments"
              value={terminology.appointments}
              onChange={(e) => setTerminology({ ...terminology, appointments: e.target.value })}
              placeholder="e.g., Appointments, Sessions, Meetings"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service">Service (Singular)</Label>
            <Input
              id="service"
              value={terminology.service}
              onChange={(e) => setTerminology({ ...terminology, service: e.target.value })}
              placeholder="e.g., Treatment, Workout, Consultation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="services">Services (Plural)</Label>
            <Input
              id="services"
              value={terminology.services}
              onChange={(e) => setTerminology({ ...terminology, services: e.target.value })}
              placeholder="e.g., Treatments, Workouts, Consultations"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment">Payment (Singular)</Label>
            <Input
              id="payment"
              value={terminology.payment}
              onChange={(e) => setTerminology({ ...terminology, payment: e.target.value })}
              placeholder="e.g., Bill, Invoice, Payment"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payments">Payments (Plural)</Label>
            <Input
              id="payments"
              value={terminology.payments}
              onChange={(e) => setTerminology({ ...terminology, payments: e.target.value })}
              placeholder="e.g., Bills, Invoices, Payments"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateTerminology.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateTerminology.isPending ? 'Saving...' : 'Save Terminology'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
