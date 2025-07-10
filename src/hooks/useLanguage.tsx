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
  signIn: string;
  signUp: string;
  createAccount: string;
  email: string;
  password: string;
  phone: string;
  optional: string;
  welcome: string;
  accessDentiBot: string;
  signInOrCreate: string;
  signInButton: string;
  createAccountButton: string;
  accountCreatedSuccess: string;
  checkEmailConfirm: string;
  signUpError: string;
  signInError: string;
  signInSuccess: string;
  welcomeToDentiBot: string;
  
  // Placeholders
  enterFirstName: string;
  enterLastName: string;
  enterPhoneNumber: string;
  enterMedicalHistory: string;
  selectLanguage: string;
  enterEmail: string;
  enterPassword: string;
  
  // Dental Chat
  dentalAssistant: string;
  typeMessage: string;
  send: string;
  welcomeMessage: string;
  detailedWelcomeMessage: string;
  detailedWelcomeMessageWithName: (name: string) => string;
  
  // Landing page
  intelligentDentalAssistant: string;
  experienceFuture: string;
  viewOurDentists: string;
  aiDiagnosis: string;
  aiDiagnosisDesc: string;
  smartBooking: string;
  smartBookingDesc: string;
  support24_7: string;
  support24_7Desc: string;
  initializingExperience: string;
  preparingAssistant: string;
  
  // Navigation
  chat: string;
  appointments: string;
  
  // Appointment booking
  bookAppointment: string;
  bookConsultationDescription: string;
  chooseDentist: string;
  selectDate: string;
  selectTime: string;
  availableSlots: string;
  consultationReason: string;
  generalConsultation: string;
  routineCheckup: string;
  dentalPain: string;
  emergency: string;
  cleaning: string;
  other: string;
  bookNow: string;
  appointmentConfirmed: string;
  errorTitle: string;
  cannotLoadSlots: string;
  cannotLoadDentists: string;
  missingInformation: string;
  selectDentistDateTime: string;
  slotNoLongerAvailable: string;
  cannotCreateAppointment: string;
  
  // Onboarding
  welcomeToFirstSmile: string;
  yourAIDentalAssistant: string;
  onboardingIntro: string;
  smartFeaturesService: string;
  aiChat: string;
  aiChatDesc: string;
  photoAnalysis: string;
  photoAnalysisDesc: string;
  familyCare: string;
  familyCareDesc: string;
  bookForFamilyTitle: string;
  familyFriendlyBooking: string;
  bookForYourself: string;
  bookForChildren: string;
  bookForFamily: string;
  alwaysTellDuration: string;
  readyToStart: string;
  youreAllSet: string;
  onboardingEnd: string;
  proTip: string;
  proTipText: string;
  letsStart: string;
  next: string;
  back: string;
  
  // Language selection
  selectPreferredLanguage: string;
  languageSelectionDescription: string;
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
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    optional: 'optional',
    welcome: 'Welcome',
    accessDentiBot: 'Access DentiBot',
    signInOrCreate: 'Sign in or create an account to get started',
    signInButton: 'Sign in',
    createAccountButton: 'Create account',
    accountCreatedSuccess: 'Account created successfully!',
    checkEmailConfirm: 'Check your email to confirm your account.',
    signUpError: 'Sign up error',
    signInError: 'Sign in error',
    signInSuccess: 'Sign in successful!',
    welcomeToDentiBot: 'Welcome to DentiBot.',
    
    // Placeholders
    enterFirstName: 'Enter your first name',
    enterLastName: 'Enter your last name',
    enterPhoneNumber: 'Enter your phone number',
    enterMedicalHistory: 'Enter relevant medical history, allergies, medications, etc.',
    selectLanguage: 'Select language',
    enterEmail: 'your@email.com',
    enterPassword: '••••••••',
    
    // Dental Chat
    dentalAssistant: 'Dental Assistant',
    typeMessage: 'Type your message...',
    send: 'Send',
    welcomeMessage: 'Hello! I\'m DentiBot. How can I help you today? 🦷',
    detailedWelcomeMessage: `Welcome to First Smile AI! 🦷✨

I'm your AI dental assistant, available 24/7 to help you with:

🤖 **AI Chat** - Get instant answers to your dental questions
📅 **Smart Booking** - Book appointments intelligently with duration info
📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  
👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members

💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!

How can I help you today?`,
    detailedWelcomeMessageWithName: (name: string) => `Welcome to First Smile AI! 🦷✨

Hello ${name}! I'm your AI dental assistant, available 24/7 to help you with:

🤖 **AI Chat** - Get instant answers to your dental questions
📅 **Smart Booking** - Book appointments intelligently with duration info
📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  
👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members

💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!

How can I help you today?`,
    
    // Landing page
    intelligentDentalAssistant: 'Your Intelligent Dental Assistant 24/7',
    experienceFuture: 'Experience the future of dental care with AI-powered consultations, smart appointment booking, and personalized treatment recommendations. Available 24/7 to help you maintain your perfect smile.',
    viewOurDentists: 'View Our Dentists',
    aiDiagnosis: 'AI Diagnosis',
    aiDiagnosisDesc: 'Get instant AI-powered assessments',
    smartBooking: 'Smart Booking',
    smartBookingDesc: 'Book appointments intelligently',
    support24_7: '24/7 Support',
    support24_7Desc: 'Round-the-clock assistance',
    initializingExperience: 'Initializing your experience',
    preparingAssistant: 'Preparing your personalized dental assistant powered by advanced AI technology',
    
    // Navigation
    chat: 'Chat',
    appointments: 'Appointments',
    
    // Appointment booking
    bookAppointment: 'Book Appointment',
    bookConsultationDescription: 'Book your dental consultation in just a few clicks',
    chooseDentist: 'Choose Dentist',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    availableSlots: 'Available Slots',
    consultationReason: 'Consultation Reason',
    generalConsultation: 'General consultation',
    routineCheckup: 'Routine checkup',
    dentalPain: 'Dental pain',
    emergency: 'Emergency',
    cleaning: 'Cleaning',
    other: 'Other',
    bookNow: 'Book Now',
    appointmentConfirmed: 'Appointment confirmed!',
    errorTitle: 'Error',
    cannotLoadSlots: 'Unable to load available slots',
    cannotLoadDentists: 'Unable to load dentist list',
    missingInformation: 'Missing information',
    selectDentistDateTime: 'Please select a dentist, date and time',
    slotNoLongerAvailable: 'This slot is no longer available',
    cannotCreateAppointment: 'Unable to create appointment',
    
    // Onboarding
    welcomeToFirstSmile: 'Welcome to First Smile AI! 🦷',
    yourAIDentalAssistant: 'Your AI Dental Assistant',
    onboardingIntro: 'I\'m here to help you with all your dental needs, 24/7. Let me show you what I can do!',
    smartFeaturesService: 'Smart Features at Your Service',
    aiChat: 'AI Chat',
    aiChatDesc: 'Get instant answers to dental questions',
    photoAnalysis: 'Photo Analysis',
    photoAnalysisDesc: 'Upload photos for AI analysis',
    familyCare: 'Family Care',
    familyCareDesc: 'Book for family members too',
    bookForFamilyTitle: 'Book for Anyone in Your Family',
    familyFriendlyBooking: 'Family-Friendly Booking',
    bookForYourself: 'Book appointments for yourself',
    bookForChildren: 'Book for your children',
    bookForFamily: 'Book for family members',
    alwaysTellDuration: 'I\'ll always tell you appointment duration and end time',
    readyToStart: 'Ready to Get Started?',
    youreAllSet: 'You\'re All Set! 🎉',
    onboardingEnd: 'Start chatting with me below to book appointments, ask questions, or get dental advice.',
    proTip: '💡 Pro Tip:',
    proTipText: 'Just tell me what\'s bothering you, and I\'ll guide you through everything!',
    letsStart: 'Let\'s Start!',
    next: 'Next',
    back: 'Back',
    
    // Language selection
    selectPreferredLanguage: 'Select Your Preferred Language',
    languageSelectionDescription: 'Choose your language to get started with First Smile AI',
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
    signIn: 'Connexion',
    signUp: 'Inscription',
    createAccount: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    phone: 'Téléphone',
    optional: 'optionnel',
    welcome: 'Bienvenue',
    accessDentiBot: 'Accès à DentiBot',
    signInOrCreate: 'Connectez-vous ou créez un compte pour commencer',
    signInButton: 'Se connecter',
    createAccountButton: 'Créer un compte',
    accountCreatedSuccess: 'Compte créé avec succès !',
    checkEmailConfirm: 'Vérifiez votre email pour confirmer votre compte.',
    signUpError: 'Erreur lors de l\'inscription',
    signInError: 'Erreur lors de la connexion',
    signInSuccess: 'Connexion réussie !',
    welcomeToDentiBot: 'Bienvenue sur DentiBot.',
    
    // Placeholders
    enterFirstName: 'Entrez votre prénom',
    enterLastName: 'Entrez votre nom de famille',
    enterPhoneNumber: 'Entrez votre numéro de téléphone',
    enterMedicalHistory: 'Entrez les antécédents médicaux pertinents, allergies, médicaments, etc.',
    selectLanguage: 'Sélectionner la langue',
    enterEmail: 'votre@email.com',
    enterPassword: '••••••••',
    
    // Dental Chat
    dentalAssistant: 'Assistant dentaire',
    typeMessage: 'Tapez votre message...',
    send: 'Envoyer',
    welcomeMessage: 'Bonjour ! Je suis DentiBot. Comment puis-je vous aider aujourd\'hui ? 🦷',
    detailedWelcomeMessage: `Bienvenue sur First Smile AI ! 🦷✨

Je suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :

🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires
📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée
📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA
👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille

💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !

Comment puis-je vous aider aujourd'hui ?`,
    detailedWelcomeMessageWithName: (name: string) => `Bienvenue sur First Smile AI ! 🦷✨

Bonjour ${name} ! Je suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :

🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires
📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée
📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA
👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille

💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !

Comment puis-je vous aider aujourd'hui ?`,
    
    // Landing page
    intelligentDentalAssistant: 'Votre Assistant Dentaire Intelligent 24h/24',
    experienceFuture: 'Découvrez l\'avenir des soins dentaires avec des consultations IA, une prise de rendez-vous intelligente et des recommandations de traitement personnalisées. Disponible 24h/24 pour vous aider à maintenir votre sourire parfait.',
    viewOurDentists: 'Voir Nos Dentistes',
    aiDiagnosis: 'Diagnostic IA',
    aiDiagnosisDesc: 'Obtenez des évaluations instantanées alimentées par l\'IA',
    smartBooking: 'Réservation Intelligente',
    smartBookingDesc: 'Réservez des rendez-vous intelligemment',
    support24_7: 'Support 24h/24',
    support24_7Desc: 'Assistance permanente',
    initializingExperience: 'Initialisation de votre expérience',
    preparingAssistant: 'Préparation de votre assistant dentaire personnalisé alimenté par une technologie IA avancée',
    
    // Navigation
    chat: 'Chat',
    appointments: 'Rendez-vous',
    
    // Appointment booking
    bookAppointment: 'Prendre Rendez-vous',
    bookConsultationDescription: 'Réservez votre consultation dentaire en quelques clics',
    chooseDentist: 'Choisir un Dentiste',
    selectDate: 'Sélectionner une Date',
    selectTime: 'Sélectionner l\'Heure',
    availableSlots: 'Créneaux Disponibles',
    consultationReason: 'Motif de Consultation',
    generalConsultation: 'Consultation générale',
    routineCheckup: 'Contrôle de routine',
    dentalPain: 'Douleur dentaire',
    emergency: 'Urgence',
    cleaning: 'Nettoyage',
    other: 'Autre',
    bookNow: 'Réserver Maintenant',
    appointmentConfirmed: 'Rendez-vous confirmé !',
    errorTitle: 'Erreur',
    cannotLoadSlots: 'Impossible de charger les créneaux disponibles',
    cannotLoadDentists: 'Impossible de charger la liste des dentistes',
    missingInformation: 'Informations manquantes',
    selectDentistDateTime: 'Veuillez sélectionner un dentiste, une date et une heure',
    slotNoLongerAvailable: 'Ce créneau n\'est plus disponible',
    cannotCreateAppointment: 'Impossible de créer le rendez-vous',
    
    // Onboarding
    welcomeToFirstSmile: 'Bienvenue sur First Smile AI ! 🦷',
    yourAIDentalAssistant: 'Votre Assistant Dentaire IA',
    onboardingIntro: 'Je suis là pour vous aider avec tous vos besoins dentaires, 24h/24. Laissez-moi vous montrer ce que je peux faire !',
    smartFeaturesService: 'Fonctionnalités Intelligentes à Votre Service',
    aiChat: 'Chat IA',
    aiChatDesc: 'Obtenez des réponses instantanées aux questions dentaires',
    photoAnalysis: 'Analyse Photo',
    photoAnalysisDesc: 'Téléchargez des photos pour une analyse IA',
    familyCare: 'Soins Familiaux',
    familyCareDesc: 'Réservez aussi pour les membres de la famille',
    bookForFamilyTitle: 'Réservez pour Toute Votre Famille',
    familyFriendlyBooking: 'Réservation Familiale',
    bookForYourself: 'Réservez des rendez-vous pour vous-même',
    bookForChildren: 'Réservez pour vos enfants',
    bookForFamily: 'Réservez pour les membres de la famille',
    alwaysTellDuration: 'Je vous indiquerai toujours la durée du rendez-vous et l\'heure de fin',
    readyToStart: 'Prêt à Commencer ?',
    youreAllSet: 'Vous êtes Prêt ! 🎉',
    onboardingEnd: 'Commencez à discuter avec moi ci-dessous pour prendre des rendez-vous, poser des questions ou obtenir des conseils dentaires.',
    proTip: '💡 Astuce Pro :',
    proTipText: 'Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !',
    letsStart: 'Commençons !',
    next: 'Suivant',
    back: 'Retour',
    
    // Language selection
    selectPreferredLanguage: 'Sélectionnez Votre Langue Préférée',
    languageSelectionDescription: 'Choisissez votre langue pour commencer avec First Smile AI',
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
    signIn: 'Inloggen',
    signUp: 'Registreren',
    createAccount: 'Account aanmaken',
    email: 'E-mail',
    password: 'Wachtwoord',
    phone: 'Telefoon',
    optional: 'optioneel',
    welcome: 'Welkom',
    accessDentiBot: 'Toegang tot DentiBot',
    signInOrCreate: 'Log in of maak een account aan om te beginnen',
    signInButton: 'Inloggen',
    createAccountButton: 'Account aanmaken',
    accountCreatedSuccess: 'Account succesvol aangemaakt!',
    checkEmailConfirm: 'Controleer uw e-mail om uw account te bevestigen.',
    signUpError: 'Registratiefout',
    signInError: 'Inlogfout',
    signInSuccess: 'Inloggen gelukt!',
    welcomeToDentiBot: 'Welkom bij DentiBot.',
    
    // Placeholders
    enterFirstName: 'Voer uw voornaam in',
    enterLastName: 'Voer uw achternaam in',
    enterPhoneNumber: 'Voer uw telefoonnummer in',
    enterMedicalHistory: 'Voer relevante medische voorgeschiedenis, allergieën, medicijnen, etc. in',
    selectLanguage: 'Selecteer taal',
    enterEmail: 'uw@email.com',
    enterPassword: '••••••••',
    
    // Dental Chat
    dentalAssistant: 'Tandheelkundige assistent',
    typeMessage: 'Typ uw bericht...',
    send: 'Versturen',
    welcomeMessage: 'Hallo! Ik ben DentiBot. Hoe kan ik u vandaag helpen? 🦷',
    detailedWelcomeMessage: `Welkom bij First Smile AI! 🦷✨

Ik ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:

🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen
📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie
📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse
👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden

💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!

Hoe kan ik u vandaag helpen?`,
    detailedWelcomeMessageWithName: (name: string) => `Welkom bij First Smile AI! 🦷✨

Hallo ${name}! Ik ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:

🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen
📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie
📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse
👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden

💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!

Hoe kan ik u vandaag helpen?`,
    
    // Landing page
    intelligentDentalAssistant: 'Uw Intelligente Tandheelkundige Assistent 24/7',
    experienceFuture: 'Ervaar de toekomst van tandheelkundige zorg met AI-consultaties, slimme afspraakplanning en gepersonaliseerde behandelingsaanbevelingen. 24/7 beschikbaar om u te helpen uw perfecte glimlach te behouden.',
    viewOurDentists: 'Bekijk Onze Tandartsen',
    aiDiagnosis: 'AI Diagnose',
    aiDiagnosisDesc: 'Krijg direct AI-ondersteunde beoordelingen',
    smartBooking: 'Slimme Boekingen',
    smartBookingDesc: 'Boek afspraken intelligent',
    support24_7: '24/7 Ondersteuning',
    support24_7Desc: 'Hulp rond de klok',
    initializingExperience: 'Uw ervaring wordt geïnitialiseerd',
    preparingAssistant: 'Uw gepersonaliseerde tandheelkundige assistent wordt voorbereid met geavanceerde AI-technologie',
    
    // Navigation
    chat: 'Chat',
    appointments: 'Afspraken',
    
    // Appointment booking
    bookAppointment: 'Afspraak Maken',
    bookConsultationDescription: 'Boek uw tandheelkundige consultatie in slechts een paar klikken',
    chooseDentist: 'Kies Tandarts',
    selectDate: 'Selecteer Datum',
    selectTime: 'Selecteer Tijd',
    availableSlots: 'Beschikbare Tijdsloten',
    consultationReason: 'Reden voor Consultatie',
    generalConsultation: 'Algemene consultatie',
    routineCheckup: 'Routine controle',
    dentalPain: 'Tandpijn',
    emergency: 'Spoed',
    cleaning: 'Reiniging',
    other: 'Anders',
    bookNow: 'Nu Boeken',
    appointmentConfirmed: 'Afspraak bevestigd!',
    errorTitle: 'Fout',
    cannotLoadSlots: 'Kan beschikbare tijdsloten niet laden',
    cannotLoadDentists: 'Kan tandartslijst niet laden',
    missingInformation: 'Ontbrekende informatie',
    selectDentistDateTime: 'Selecteer een tandarts, datum en tijd',
    slotNoLongerAvailable: 'Dit tijdslot is niet meer beschikbaar',
    cannotCreateAppointment: 'Kan afspraak niet maken',
    
    // Onboarding
    welcomeToFirstSmile: 'Welkom bij First Smile AI! 🦷',
    yourAIDentalAssistant: 'Uw AI Tandheelkundige Assistent',
    onboardingIntro: 'Ik ben er om u te helpen met al uw tandheelkundige behoeften, 24/7. Laat me u tonen wat ik kan doen!',
    smartFeaturesService: 'Slimme Functies Tot Uw Dienst',
    aiChat: 'AI Chat',
    aiChatDesc: 'Krijg directe antwoorden op tandheelkundige vragen',
    photoAnalysis: 'Foto Analyse',
    photoAnalysisDesc: 'Upload foto\'s voor AI-analyse',
    familyCare: 'Familiezorg',
    familyCareDesc: 'Boek ook voor familieleden',
    bookForFamilyTitle: 'Boek voor Iedereen in Uw Familie',
    familyFriendlyBooking: 'Familievriendelijke Boekingen',
    bookForYourself: 'Boek afspraken voor uzelf',
    bookForChildren: 'Boek voor uw kinderen',
    bookForFamily: 'Boek voor familieleden',
    alwaysTellDuration: 'Ik zal u altijd de duur van de afspraak en eindtijd vertellen',
    readyToStart: 'Klaar om te Beginnen?',
    youreAllSet: 'U bent Klaar! 🎉',
    onboardingEnd: 'Begin hieronder met me te chatten om afspraken te maken, vragen te stellen of tandheelkundige adviezen te krijgen.',
    proTip: '💡 Pro Tip:',
    proTipText: 'Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!',
    letsStart: 'Laten we Beginnen!',
    next: 'Volgende',
    back: 'Terug',
    
    // Language selection
    selectPreferredLanguage: 'Selecteer Uw Voorkeurstaal',
    languageSelectionDescription: 'Kies uw taal om te beginnen met First Smile AI',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

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