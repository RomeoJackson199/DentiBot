import React from "react";
import { FileText } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentRecordsTable } from "@/components/TreatmentRecordsTable";

export default function PatientTreatmentHistoryPage() {
  const { t } = useLanguage();
  const [patientId, setPatientId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (profile?.id) setPatientId(profile.id);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" /> {t.pnav.care.history}
      </h1>
      {patientId ? (
        <TreatmentRecordsTable patientId={patientId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">{t.loading}</div>
      )}
    </div>
  );
}

