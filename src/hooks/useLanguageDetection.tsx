import { useLanguage } from '@/hooks/useLanguage';

export type SupportedLanguage = 'en' | 'fr';

interface LanguageDetectionHook {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, options?: any) => string;
}

export const useLanguageDetection = (): LanguageDetectionHook => {
  const { language, setLanguage, t } = useLanguage();
  const translate = (key: string, options?: any) => (t as any)(key, options);
  return {
    language: language as SupportedLanguage,
    setLanguage: setLanguage as (lang: SupportedLanguage) => void,
    t: translate,
  };
};
