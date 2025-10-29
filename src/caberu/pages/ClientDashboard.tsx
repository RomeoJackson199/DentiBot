import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, analyticsApi, notificationApi, paymentApi } from '../api';
import { AppointmentList } from '../components/AppointmentList';
import { ChatPanel } from '../components/ChatPanel';
import { PaymentList } from '../components/PaymentList';
import { AnalyticsSummary } from '../components/AnalyticsSummary';
import { BookingAssistant } from '../components/BookingAssistant';
import { NotificationList } from '../components/NotificationList';

export const ClientDashboard: FC = () => {
  const { user, token } = useAuth();

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', 'client'],
    queryFn: () => appointmentApi.list('client', token!),
    enabled: Boolean(token),
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['payments', 'client'],
    queryFn: () => paymentApi.list(token!),
    enabled: Boolean(token),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'client'],
    queryFn: () => analyticsApi.overview(token!),
    enabled: Boolean(token),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationApi.list(token!),
    enabled: Boolean(token),
  });

  const upcoming = useMemo(() => appointments.filter((appointment) => new Date(appointment.startTime) > new Date()), [appointments]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-teal-600">Client workspace</p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-slate-500">Review upcoming sessions, pay invoices, and chat with Caberu.</p>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <AnalyticsSummary data={analytics} />
            <AppointmentList appointments={upcoming.slice(0, 5)} title="Upcoming appointments" />
            <BookingAssistant
              professionalId={user?.businessId ?? undefined}
              onBooked={() => {
                refetchPayments();
                refetchAppointments();
              }}
            />
            <PaymentList payments={payments} onRefresh={refetchPayments} />
          </div>
          <div className="flex flex-col gap-6">
            <ChatPanel professionalId={user?.businessId ?? undefined} />
            <NotificationList notifications={notifications} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
