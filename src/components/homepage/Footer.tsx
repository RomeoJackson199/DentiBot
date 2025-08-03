import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      <div className="space-x-4">
        <Link to="/terms" className="underline">
          {t.termsTitle}
        </Link>
        <Link to="/privacy" className="underline">
          {t.privacyPolicyLink}
        </Link>
      </div>
    </footer>
  );
};
