import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppointmentsTab } from "@/components/patient/AppointmentsTab";
import { supabase } from "@/integrations/supabase/client";

export default function PatientAppointmentsPage() {
  const { t } = useLanguage();
  const [user, setUser] = React.useState<User | null>(null);
  const [tab, setTab] = React.useState<'upcoming' | 'past' | 'book'>('upcoming');

  React.useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user as any);
  })(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" /> {t.pnav.care.appointments}</h1>
        <Button size="sm" className="gap-2" onClick={() => setTab('book')} aria-label={t.bookAppointment}>
          <Plus className="h-4 w-4" />
          {t.bookAppointment}
        </Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="book">Book</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="upcoming">
            {user && <AppointmentsTab user={user} />}
          </TabsContent>
          <TabsContent value="past">
            {user && <AppointmentsTab user={user} />}
          </TabsContent>
          <TabsContent value="book">
            {user && <AppointmentsTab user={user} onOpenAssistant={() => { /* fallback */ }} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

