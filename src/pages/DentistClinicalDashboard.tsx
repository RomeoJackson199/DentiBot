import { User } from "@supabase/supabase-js";
import { ClinicalToday } from "@/components/ClinicalToday";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <div>
      <PageHeader 
        title="Clinical Dashboard"
        subtitle="Today's schedule and urgent cases"
        breadcrumbs={[
          { label: 'Home', href: '/dentist' },
          { label: 'Clinical' }
        ]}
      />
      <ClinicalToday 
        dentistId={dentistId} 
        user={user!} 
        onOpenPatientsTab={() => {}} 
      />
    </div>
  );
}

export default DentistClinicalDashboard;