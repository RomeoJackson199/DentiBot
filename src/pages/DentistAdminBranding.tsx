import { useOutletContext } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { ModernSettings } from "@/components/ModernSettings";

interface DentistContext {
  user: User;
  dentistId: string;
}

export default function DentistAdminBranding() {
  const { user } = useOutletContext<DentistContext>();
  
  return (
    <div className="p-3 md:p-4">
      <ModernSettings user={user} />
    </div>
  );
}

