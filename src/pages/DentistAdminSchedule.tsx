import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";

export default function DentistAdminSchedule() {
  const { dentistId } = useCurrentDentist();
  if (!dentistId) return null;
  return <div className="p-3 md:p-4"><EnhancedAvailabilitySettings dentistId={dentistId} /></div>;
}

