import React from "react";
import { Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { PatientDashboard } from "@/components/PatientDashboard";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export default function PatientPrescriptionsPage() {
  const { t } = useLanguage();
  const [user, setUser] = React.useState<User | null>(null);
  React.useEffect(() => { (async () => { const { data } = await supabase.auth.getUser(); setUser(data.user as any) })() }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><Pill className="h-5 w-5" /> {t.pnav.care.prescriptions}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.prescriptions}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Reuse PatientDashboard internals would be heavy; keep a simple placeholder list or link */}
          <p className="text-sm text-muted-foreground">{t.viewManageMedications}</p>
        </CardContent>
      </Card>
    </div>
  );
}

