import React from "react";
import { CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { PaymentsTab } from "@/components/patient/PaymentsTab";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";

export default function PatientBillingPage() {
  const { t } = useLanguage();
  const [user, setUser] = React.useState<User | null>(null);
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'unpaid' | 'paid' | 'statements'>('unpaid');
  const [totalDueCents, setTotalDueCents] = React.useState<number>(0);

  React.useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user as any);
    if (data.user?.id) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', data.user.id).maybeSingle();
      if (profile?.id) setPatientId(profile.id);
    }
  })(); }, []);

  React.useEffect(() => {
    (async () => {
      if (!patientId) return;
      const { data, error } = await supabase
        .from('payment_requests')
        .select('amount,status')
        .eq('patient_id', patientId);
      if (!error) {
        const open = (data || []).filter(r => ['pending','overdue'].includes(String(r.status)));
        setTotalDueCents(open.reduce((s, r: any) => s + (r.amount || 0), 0));
      }
    })();
  }, [patientId]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'unpaid') setTab('unpaid');
    if (status === 'paid') setTab('paid');
    if (status === 'statements') setTab('statements');
  }, []);

  React.useEffect(() => {
    if (tab === 'unpaid') {
      try { emitAnalyticsEvent('pnav_funnel_unpaid_open', '', { path: '/billing', status: 'unpaid' }); } catch {}
    }
  }, [tab]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5" /> {t.pnav.billing.main}</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="unpaid">
            {patientId && <PaymentsTab patientId={patientId} totalDueCents={totalDueCents} />}
          </TabsContent>
          <TabsContent value="paid">
            <Card>
              <CardHeader><CardTitle>Paid</CardTitle></CardHeader>
              <CardContent>
                {/* Could list paid invoices */}
                <p className="text-sm text-muted-foreground">Your paid invoices will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="statements">
            <Card>
              <CardHeader><CardTitle>Statements</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Download monthly statements.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

