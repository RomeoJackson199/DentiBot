import type { FC, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, analyticsApi, notificationApi, serviceApi } from '../api';
import { AppointmentList } from '../components/AppointmentList';
import { AnalyticsSummary } from '../components/AnalyticsSummary';
import { ChatPanel } from '../components/ChatPanel';
import { NotificationList } from '../components/NotificationList';
import { useToast } from '@/hooks/use-toast';

export const ProfessionalDashboard: FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [serviceForm, setServiceForm] = useState({ title: '', description: '', duration: 60, price: 120 });

  const businessId = user?.businessId ?? '';

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', 'professional'],
    queryFn: () => appointmentApi.list('professional', token!),
    enabled: Boolean(token),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'professional'],
    queryFn: () => analyticsApi.overview(token!),
    enabled: Boolean(token),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationApi.list(token!),
    enabled: Boolean(token),
  });

  const upcoming = useMemo(
    () => appointments.filter((appointment) => new Date(appointment.startTime) > new Date()),
    [appointments]
  );

  const createService = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !businessId) {
      toast({ title: 'Missing business information', variant: 'destructive' });
      return;
    }
    try {
      await serviceApi.create(businessId, serviceForm, token);
      toast({ title: 'Service created', description: `${serviceForm.title} is now available.` });
      setServiceForm({ title: '', description: '', duration: 60, price: 120 });
    } catch (error: any) {
      toast({ title: 'Unable to create service', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-teal-600">Professional workspace</p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-slate-500">Manage bookings, services, and client conversations.</p>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <AnalyticsSummary data={analytics} />
            <AppointmentList appointments={upcoming.slice(0, 6)} title="Upcoming schedule" />
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">Add a new service</h2>
              <p className="text-sm text-slate-500">Define offerings with price and duration to open AI scheduling.</p>
              <form onSubmit={createService} className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Service name</Label>
                  <Input
                    id="title"
                    value={serviceForm.title}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    step={15}
                    value={serviceForm.duration}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={5}
                    value={serviceForm.price}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={serviceForm.description}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Highlight outcomes, who it’s for, and preparation tips."
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
                    Publish service
                  </Button>
                </div>
              </form>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <ChatPanel professionalId={businessId} />
            <NotificationList notifications={notifications} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
