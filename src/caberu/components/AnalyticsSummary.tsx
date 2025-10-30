import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsOverview } from '../types';

interface AnalyticsSummaryProps {
  data?: AnalyticsOverview;
}

export const AnalyticsSummary: FC<AnalyticsSummaryProps> = ({ data }) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Bookings (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-800">{data?.totalAppointments ?? 0}</p>
          <p className="text-xs text-slate-500">Sessions confirmed in the last month.</p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-800">${data?.revenue?.toFixed(2) ?? '0.00'}</p>
          <p className="text-xs text-slate-500">Paid invoices captured through Stripe.</p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-800">{data?.clients ?? 0}</p>
          <p className="text-xs text-slate-500">Clients linked to your workspace.</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">Bookings trend</CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.weeklyBookings ?? []}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0f766e" fill="url(#colorBookings)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
