import { useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'nl' | 'fr';

interface LanguageDetectionHook {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Emergency Triage
    'triage.title': 'Emergency Dental Triage',
    'triage.subtitle': 'Please answer the following questions to assess your urgency level',
    'triage.pain.title': 'Pain Level Assessment',
    'triage.pain.question': 'On a scale of 1-10, how severe is your pain?',
    'triage.pain.none': 'No pain (1)',
    'triage.pain.severe': 'Severe pain (10)',
    'triage.symptoms.title': 'Additional Symptoms',
    'triage.symptoms.bleeding': 'Bleeding from gums or teeth',
    'triage.symptoms.swelling': 'Facial or gum swelling',
    'triage.symptoms.fever': 'Fever (>38°C)',
    'triage.symptoms.difficulty': 'Difficulty swallowing or breathing',
    'triage.symptoms.trauma': 'Recent dental trauma or injury',
    'triage.duration.title': 'Duration of Symptoms',
    'triage.duration.question': 'How long have you had these symptoms?',
    'triage.duration.hours': 'Less than 6 hours',
    'triage.duration.day': '6-24 hours',
    'triage.duration.days': '2-7 days',
    'triage.duration.week': 'More than a week',
    'triage.medical.title': 'Medical History',
    'triage.medical.diabetes': 'Diabetes',
    'triage.medical.heart': 'Heart condition',
    'triage.medical.blood': 'Blood disorders',
    'triage.medical.immune': 'Compromised immune system',
    'triage.submit': 'Assess Urgency & Book Appointment',
    'triage.result.emergency': 'EMERGENCY - Immediate attention required',
    'triage.result.high': 'HIGH URGENCY - Same day appointment needed',
    'triage.result.medium': 'MEDIUM URGENCY - Appointment within 2-3 days',
    'triage.result.low': 'LOW URGENCY - Regular appointment needed',
    // Booking
    'booking.title': 'Book Your Appointment',
    'booking.earliest': 'Earliest Available Slots',
    'booking.confirm': 'Confirm Appointment',
    'booking.success': 'Appointment booked successfully!',
    // Common
    'common.cancel': 'Cancel',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.loading': 'Loading...',
  },
  nl: {
    // Emergency Triage
    'triage.title': 'Spoed Tandheelkundige Triage',
    'triage.subtitle': 'Beantwoord de volgende vragen om uw urgentieniveau te beoordelen',
    'triage.pain.title': 'Pijnbeoordeling',
    'triage.pain.question': 'Op een schaal van 1-10, hoe erg is uw pijn?',
    'triage.pain.none': 'Geen pijn (1)',
    'triage.pain.severe': 'Erge pijn (10)',
    'triage.symptoms.title': 'Aanvullende Symptomen',
    'triage.symptoms.bleeding': 'Bloeding uit tandvlees of tanden',
    'triage.symptoms.swelling': 'Zwelling van gezicht of tandvlees',
    'triage.symptoms.fever': 'Koorts (>38°C)',
    'triage.symptoms.difficulty': 'Moeite met slikken of ademen',
    'triage.symptoms.trauma': 'Recent tandheelkundig trauma of verwonding',
    'triage.duration.title': 'Duur van Symptomen',
    'triage.duration.question': 'Hoe lang heeft u deze symptomen al?',
    'triage.duration.hours': 'Minder dan 6 uur',
    'triage.duration.day': '6-24 uur',
    'triage.duration.days': '2-7 dagen',
    'triage.duration.week': 'Meer dan een week',
    'triage.medical.title': 'Medische Geschiedenis',
    'triage.medical.diabetes': 'Diabetes',
    'triage.medical.heart': 'Hartaandoening',
    'triage.medical.blood': 'Bloedziekten',
    'triage.medical.immune': 'Verzwakt immuunsysteem',
    'triage.submit': 'Urgentie Beoordelen & Afspraak Maken',
    'triage.result.emergency': 'SPOED - Onmiddellijke aandacht vereist',
    'triage.result.high': 'HOGE URGENTIE - Afspraak dezelfde dag nodig',
    'triage.result.medium': 'GEMIDDELDE URGENTIE - Afspraak binnen 2-3 dagen',
    'triage.result.low': 'LAGE URGENTIE - Reguliere afspraak nodig',
    // Booking
    'booking.title': 'Uw Afspraak Inplannen',
    'booking.earliest': 'Vroegst Beschikbare Tijdsloten',
    'booking.confirm': 'Afspraak Bevestigen',
    'booking.success': 'Afspraak succesvol geboekt!',
    // Common
    'common.cancel': 'Annuleren',
    'common.next': 'Volgende',
    'common.back': 'Terug',
    'common.loading': 'Laden...',
  },
  fr: {
    // Emergency Triage
    'triage.title': 'Triage Dentaire d\'Urgence',
    'triage.subtitle': 'Veuillez répondre aux questions suivantes pour évaluer votre niveau d\'urgence',
    'triage.pain.title': 'Évaluation de la Douleur',
    'triage.pain.question': 'Sur une échelle de 1-10, quelle est l\'intensité de votre douleur?',
    'triage.pain.none': 'Aucune douleur (1)',
    'triage.pain.severe': 'Douleur sévère (10)',
    'triage.symptoms.title': 'Symptômes Supplémentaires',
    'triage.symptoms.bleeding': 'Saignement des gencives ou des dents',
    'triage.symptoms.swelling': 'Gonflement du visage ou des gencives',
    'triage.symptoms.fever': 'Fièvre (>38°C)',
    'triage.symptoms.difficulty': 'Difficulté à avaler ou respirer',
    'triage.symptoms.trauma': 'Traumatisme dentaire récent ou blessure',
    'triage.duration.title': 'Durée des Symptômes',
    'triage.duration.question': 'Depuis combien de temps avez-vous ces symptômes?',
    'triage.duration.hours': 'Moins de 6 heures',
    'triage.duration.day': '6-24 heures',
    'triage.duration.days': '2-7 jours',
    'triage.duration.week': 'Plus d\'une semaine',
    'triage.medical.title': 'Antécédents Médicaux',
    'triage.medical.diabetes': 'Diabète',
    'triage.medical.heart': 'Maladie cardiaque',
    'triage.medical.blood': 'Troubles sanguins',
    'triage.medical.immune': 'Système immunitaire compromis',
    'triage.submit': 'Évaluer l\'Urgence et Prendre Rendez-vous',
    'triage.result.emergency': 'URGENCE - Attention immédiate requise',
    'triage.result.high': 'URGENCE ÉLEVÉE - Rendez-vous le jour même nécessaire',
    'triage.result.medium': 'URGENCE MOYENNE - Rendez-vous dans 2-3 jours',
    'triage.result.low': 'URGENCE FAIBLE - Rendez-vous régulier nécessaire',
    // Booking
    'booking.title': 'Réserver Votre Rendez-vous',
    'booking.earliest': 'Créneaux Disponibles au Plus Tôt',
    'booking.confirm': 'Confirmer le Rendez-vous',
    'booking.success': 'Rendez-vous réservé avec succès!',
    // Common
    'common.cancel': 'Annuler',
    'common.next': 'Suivant',
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
  },
};

const detectBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
  return ['en', 'nl', 'fr'].includes(browserLang) ? browserLang : 'en';
};

export const useLanguageDetection = (): LanguageDetectionHook => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const stored = localStorage.getItem('preferred-language') as SupportedLanguage;
    return stored || detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { language, setLanguage, t };
};