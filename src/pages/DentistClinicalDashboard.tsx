import { User } from "@supabase/supabase-js";
import { ClinicalToday } from "@/components/ClinicalToday";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { Loader2 } from "lucide-react";

interface DentistClinicalDashboardProps {
  user?: User;
}

export function DentistClinicalDashboard({ user }: DentistClinicalDashboardProps) {
  const { dentistId, loading, error } = useCurrentDentist();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dentistId) {
    return (
      <div className="flex justify-center p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error || "You are not registered as a dentist. Please contact support."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ClinicalToday 
        dentistId={dentistId} 
        user={user!} 
        onOpenPatientsTab={() => {}} 
      />
    </div>
  );
}

export default DentistClinicalDashboard;