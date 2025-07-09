import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'nl';

interface Translations {
  // General
  settings: string;
  general: string;
  theme: string;
  personal: string;
  language: string;
  light: string;
  dark: string;
  save: string;
  
  // Personal Info
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  medicalHistory: string;
  personalInformation: string;
  savePersonalInfo: string;
  
  // Messages
  languageUpdated: string;
  languageChangedTo: string;
  themeUpdated: string;
  switchedToMode: string;
  personalInfoSaved: string;
  personalInfoUpdated: string;
  
  // Auth
  signOut: string;
  
  // Placeholders
  enterFirstName: string;
  enterLastName: string;
  enterPhoneNumber: string;
  enterMedicalHistory: string;
  selectLanguage: string;
  
  // Dental Chat
  dentalAssistant: string;
  typeMessage: string;
  send: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // General
    settings: 'Settings',
    general: 'General',
    theme: 'Theme',
    personal: 'Personal',
    language: 'Preferred Language',
    light: 'Light',
    dark: 'Dark',
    save: 'Save',
    
    // Personal Info
    firstName: 'First Name',
    lastName: 'Last Name',
    phoneNumber: 'Phone Number',
    dateOfBirth: 'Date of Birth',
    medicalHistory: 'Medical History',
    personalInformation: 'Personal Information',
    savePersonalInfo: 'Save Personal Information',
    
    // Messages
    languageUpdated: 'Language Updated',
    languageChangedTo: 'Language changed to',
    themeUpdated: 'Theme Updated',
    switchedToMode: 'Switched to',
    personalInfoSaved: 'Personal Information Saved',
    personalInfoUpdated: 'Your information has been updated successfully.',
    
    // Auth
    signOut: 'Sign Out',
    
    // Placeholders
    enterFirstName: 'Enter your first name',
    enterLastName: 'Enter your last name',
    enterPhoneNumber: 'Enter your phone number',
    enterMedicalHistory: 'Enter relevant medical history, allergies, medications, etc.',
    selectLanguage: 'Select language',
    
    // Dental Chat
    dentalAssistant: 'Dental Assistant',
    typeMessage: 'Type your message...',
    send: 'Send'
  },
  fr: {
    // General
    settings: 'Paramètres',
    general: 'Général',
    theme: 'Thème',
    personal: 'Personnel',
    language: 'Langue préférée',
    light: 'Clair',
    dark: 'Sombre',
    save: 'Enregistrer',
    
    // Personal Info
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    phoneNumber: 'Numéro de téléphone',
    dateOfBirth: 'Date de naissance',
    medicalHistory: 'Antécédents médicaux',
    personalInformation: 'Informations personnelles',
    savePersonalInfo: 'Enregistrer les informations personnelles',
    
    // Messages
    languageUpdated: 'Langue mise à jour',
    languageChangedTo: 'Langue changée en',
    themeUpdated: 'Thème mis à jour',
    switchedToMode: 'Basculé en mode',
    personalInfoSaved: 'Informations personnelles enregistrées',
    personalInfoUpdated: 'Vos informations ont été mises à jour avec succès.',
    
    // Auth
    signOut: 'Se déconnecter',
    
    // Placeholders
    enterFirstName: 'Entrez votre prénom',
    enterLastName: 'Entrez votre nom de famille',
    enterPhoneNumber: 'Entrez votre numéro de téléphone',
    enterMedicalHistory: 'Entrez les antécédents médicaux pertinents, allergies, médicaments, etc.',
    selectLanguage: 'Sélectionner la langue',
    
    // Dental Chat
    dentalAssistant: 'Assistant dentaire',
    typeMessage: 'Tapez votre message...',
    send: 'Envoyer'
  },
  nl: {
    // General
    settings: 'Instellingen',
    general: 'Algemeen',
    theme: 'Thema',
    personal: 'Persoonlijk',
    language: 'Voorkeurstaal',
    light: 'Licht',
    dark: 'Donker',
    save: 'Opslaan',
    
    // Personal Info
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    phoneNumber: 'Telefoonnummer',
    dateOfBirth: 'Geboortedatum',
    medicalHistory: 'Medische voorgeschiedenis',
    personalInformation: 'Persoonlijke informatie',
    savePersonalInfo: 'Persoonlijke informatie opslaan',
    
    // Messages
    languageUpdated: 'Taal bijgewerkt',
    languageChangedTo: 'Taal gewijzigd naar',
    themeUpdated: 'Thema bijgewerkt',
    switchedToMode: 'Overgeschakeld naar',
    personalInfoSaved: 'Persoonlijke informatie opgeslagen',
    personalInfoUpdated: 'Uw informatie is succesvol bijgewerkt.',
    
    // Auth
    signOut: 'Uitloggen',
    
    // Placeholders
    enterFirstName: 'Voer uw voornaam in',
    enterLastName: 'Voer uw achternaam in',
    enterPhoneNumber: 'Voer uw telefoonnummer in',
    enterMedicalHistory: 'Voer relevante medische voorgeschiedenis, allergieën, medicijnen, etc. in',
    selectLanguage: 'Selecteer taal',
    
    // Dental Chat
    dentalAssistant: 'Tandheelkundige assistent',
    typeMessage: 'Typ uw bericht...',
    send: 'Versturen'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['en', 'fr', 'nl'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};