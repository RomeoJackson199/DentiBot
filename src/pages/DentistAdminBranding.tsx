import { ModernSettings } from "@/components/ModernSettings";

export default function DentistAdminBranding() {
  // Fallback stub if ModernSettings is not exhaustive for branding/localization
  try {
    return <div className="p-3 md:p-4"><ModernSettings /></div>;
  } catch {
    return <div className="p-3 md:p-4">Branding & Localization coming soon.</div>;
  }
}

