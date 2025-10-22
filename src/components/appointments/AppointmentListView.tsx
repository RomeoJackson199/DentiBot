import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface AppointmentListViewProps {
  dentistId: string;
  filters: any;
}

export function AppointmentListView({ dentistId, filters }: AppointmentListViewProps) {
  const { t } = useLanguage();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-list", dentistId, filters],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq("dentist_id", dentistId)
        .order("appointment_date", { ascending: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.type !== "all") {
        query = query.eq("reason", filters.type);
      }

      if (filters.patient) {
        // This is a simplified search - in production you'd want full-text search
        query = query.ilike("patient_name", `%${filters.patient}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const [showAll, setShowAll] = useState(false);
  const displayed = useMemo(() => {
    const list = appointments || [];
    return showAll ? list : list.slice(0, 10);
  }, [appointments, showAll]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-4">
      {displayed?.map((apt) => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
      {(!appointments || appointments.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          {t.noAppointmentsFound}
        </p>
      )}
      {appointments && appointments.length > 10 && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? t.showLess : `${t.viewMore} (${appointments.length - 10} ${t.more})`}
          </Button>
        </div>
      )}
    </div>
  );
}
