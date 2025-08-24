import { PatientManagement } from "@/components/PatientManagement";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";

export default function DentistClinicalPatients() {
  const { dentistId } = useCurrentDentist();
  if (!dentistId) return null;
  return <PatientManagement dentistId={dentistId} />;
}

