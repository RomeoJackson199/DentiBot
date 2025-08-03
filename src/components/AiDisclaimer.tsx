import { useLanguage } from "@/hooks/useLanguage";

export const AiDisclaimer = () => {
  const { t } = useLanguage();
  return (
    <p className="text-xs text-muted-foreground mt-2">
      {t.aiAdviceDisclaimer}
    </p>
  );
};
