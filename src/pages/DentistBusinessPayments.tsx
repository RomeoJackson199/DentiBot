import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";

export default function DentistBusinessPayments() {
  const { dentistId } = useCurrentDentist();
  if (!dentistId) return null;
  return <div className="p-3 md:p-4"><PaymentRequestManager dentistId={dentistId} /></div>;
}

