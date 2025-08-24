import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { InventoryManager } from "@/components/inventory/InventoryManager";

export default function DentistOpsInventory() {
  const { dentistId, userId } = useCurrentDentist();
  if (!dentistId || !userId) return null;
  return <div className="p-3 md:p-4"><InventoryManager dentistId={dentistId} userId={userId} /></div>;
}

