import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";

interface AppointmentListViewProps {
  dentistId: string;
  filters: any;
}

export function AppointmentListView({ dentistId, filters }: AppointmentListViewProps) {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-list", dentistId, filters],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(first_name, last_name, email)
        `)
        .eq("dentist_id", dentistId)
        .order("appointment_date", { ascending: true });

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

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-4">
      {appointments?.map((apt) => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
      {(!appointments || appointments.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          No appointments found
        </p>
      )}
    </div>
  );
}
