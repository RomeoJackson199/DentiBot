import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export type Language = 'en' | 'fr';

export const changeLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useLanguage = (ns?: string) => {
  const { t: translate, i18n: i18next } = useTranslation(ns);
  const tFunc = (key: string, options?: any) => translate(key, options);
  const t = new Proxy(tFunc as any, {
    get: (_target, prop) => translate(prop as string)
  });
  const setLanguage = (lang: Language) => i18next.changeLanguage(lang);
  return {
    t,
    language: i18next.language as Language,
    setLanguage,
    currentLanguage: i18next.language,
    changeLanguage: setLanguage
  };
};
