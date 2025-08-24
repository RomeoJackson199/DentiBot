import { UnifiedAppointments } from "@/components/UnifiedAppointments";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";

export default function DentistClinicalAppointments() {
  const { dentistId } = useCurrentDentist();
  if (!dentistId) return null;
  return <div className="p-3 md:p-4"><UnifiedAppointments dentistId={dentistId} /></div>;
}

