import React from "react";
import { FileText, Activity } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentRecordsTable } from "@/components/TreatmentRecordsTable";
import { AnimatedBackground, SectionHeader, LoadingCard } from "@/components/ui/polished-components";

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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6">
        <AnimatedBackground />

        <div className="relative z-10">
          <SectionHeader
            icon={Activity}
            title={t.pnav.care.history}
            description="View your complete treatment and dental care history"
            gradient="from-indigo-600 to-purple-600"
          />
        </div>
      </div>

      {patientId ? (
        <TreatmentRecordsTable patientId={patientId} />
      ) : (
        <LoadingCard message={t.loading || "Loading your treatment history..."} />
      )}
    </div>
  );
}

