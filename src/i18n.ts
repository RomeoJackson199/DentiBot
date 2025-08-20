import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enPatient from '../locales/en/patient.json';
import enClinic from '../locales/en/clinic.json';
import enBilling from '../locales/en/billing.json';
import enAnalytics from '../locales/en/analytics.json';
import enSettings from '../locales/en/settings.json';

import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';
import frPatient from '../locales/fr/patient.json';
import frClinic from '../locales/fr/clinic.json';
import frBilling from '../locales/fr/billing.json';
import frAnalytics from '../locales/fr/analytics.json';
import frSettings from '../locales/fr/settings.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        patient: enPatient,
        clinic: enClinic,
        billing: enBilling,
        analytics: enAnalytics,
        settings: enSettings
      },
      fr: {
        common: frCommon,
        auth: frAuth,
        patient: frPatient,
        clinic: frClinic,
        billing: frBilling,
        analytics: frAnalytics,
        settings: frSettings
      }
    },
    fallbackLng: 'en',
    ns: ['common', 'auth', 'patient', 'clinic', 'billing', 'analytics', 'settings'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie']
    },
    interpolation: { escapeValue: false }
  });

export default i18n;
