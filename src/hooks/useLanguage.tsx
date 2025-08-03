import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "fr" | "nl";

interface Translations {
  // Error & status messages
  error: string;
  success: string;
  microphoneAccessError: string;
  transcriptionFailed: string;
  voiceProcessingError: string;
  // General
  settings: string;
  general: string;
  theme: string;
  personal: string;
  language: string;
  light: string;
  dark: string;
  save: string;
  confirm: string;
  cancel: string;
  close: string;
  retry: string;

  // Personal Info
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  medicalHistory: string;
  personalInformation: string;
  savePersonalInfo: string;
  address: string;
  emergencyContact: string;
  enterAddress: string;
  enterEmergencyContact: string;

  // Messages
  languageUpdated: string;
  languageChangedTo: string;
  themeUpdated: string;
  switchedToMode: string;
  personalInfoSaved: string;
  personalInfoUpdated: string;
  informationConfirmed: string;
  changesSaved: string;
  privacyNotice: string;
  consentHealthData: string;
  childConsentNote: string;
  downloadMyData: string;
  deleteAccount: string;
  deleteAccountConfirm: string;
  aiAdviceDisclaimer: string;

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

  // Appointments list
  myAppointments: string;
  appointmentHistory: string;
  upcomingAppointments: string;
  pastAppointments: string;
  newAppointment: string;
  appointmentDetails: string;
  loading: string;
  noUpcomingAppointments: string;
  noPastAppointments: string;
  reschedule: string;
  cancelAppointment: string;
  confirmCancellation: string;
  confirmCancellationMessage: string;
  keepAppointment: string;
  yesCancelAppointment: string;
  appointmentCancelled: string;
  failedToCancelAppointment: string;

  // Chat commands & integration
  showMyAppointments: string;
  nextAppointment: string;
  suggestedTime: (dentist: string, time: string) => string;
  wouldYouLikeToBook: string;
  seeOtherOptions: string;
  appointmentSuggestion: (
    dentist: string,
    date: string,
    time: string,
  ) => string;
  bookThisSlot: string;
  showOtherTimes: string;
  settingsUpdated: string;
  preferencesChanged: string;

  // Error handling
  microphoneError: string;
  cameraError: string;
  mediaAccessDenied: string;
  mediaNotSupported: string;
  tryAgain: string;

  // Privacy & validation
  privacyPolicyLink: string;
  dataHandlingInfo: string;
  invalidPhoneFormat: string;
  invalidEmailFormat: string;
  requiredField: string;

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
  previewNotice: string;
  aiDisclaimer: string;
  acceptTerms: string;
  viewTerms: string;
  termsTitle: string;
  termsIntro: string;
  termsUse: string;
  termsPrivacy: string;
  termsMedical: string;

  // Language selection
  selectPreferredLanguage: string;
  languageSelectionDescription: string;

  // Emergency Triage
  'triage.title': string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Error & status messages
    error: "Error",
    success: "Success",
    microphoneAccessError:
      "Cannot access microphone. Please check your browser permissions and try again.",
    transcriptionFailed:
      "Voice transcription failed. Please try again or type your message.",
    voiceProcessingError: "Error processing voice message. Please try again.",

    // General
    settings: "Settings",
    general: "General",
    theme: "Theme",
    personal: "Personal",
    language: "Preferred Language",
    light: "Light",
    dark: "Dark",
    save: "Save",
    confirm: "Confirm",
    cancel: "Cancel",
    close: "Close",
    retry: "Retry",

    // Personal Info
    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",
    dateOfBirth: "Date of Birth",
    medicalHistory: "Medical History",
    personalInformation: "Personal Information",
    savePersonalInfo: "Save Personal Information",
    address: "Address",
    emergencyContact: "Emergency Contact",
    enterAddress: "Enter your address",
    enterEmergencyContact: "Enter emergency contact information",

    // Messages
    languageUpdated: "Language Updated",
    languageChangedTo: "Language changed to",
    themeUpdated: "Theme Updated",
    switchedToMode: "Switched to",
    personalInfoSaved: "Personal Information Saved",
    personalInfoUpdated: "Your information has been updated successfully.",
    informationConfirmed: "Information Confirmed",
    changesSaved: "Changes Saved",
    privacyNotice:
      "Your personal and medical data is protected according to our privacy policy.",

    // Auth
    signOut: "Sign Out",
    signIn: "Sign In",
    signUp: "Sign Up",
    createAccount: "Create Account",
    email: "Email",
    password: "Password",
    phone: "Phone",
    optional: "optional",
    welcome: "Welcome",
    accessDentiBot: "Access DentiBot",
    signInOrCreate: "Sign in or create an account to get started",
    signInButton: "Sign in",
    createAccountButton: "Create account",
    accountCreatedSuccess: "Account created successfully!",
    checkEmailConfirm: "Check your email to confirm your account.",
    signUpError: "Sign up error",
    signInError: "Sign in error",
    signInSuccess: "Sign in successful!",
    welcomeToDentiBot: "Welcome to DentiBot.",

    // Placeholders
    enterFirstName: "Enter your first name",
    enterLastName: "Enter your last name",
    enterPhoneNumber: "Enter your phone number",
    enterMedicalHistory:
      "Enter relevant medical history, allergies, medications, etc.",
    selectLanguage: "Select language",
    enterEmail: "your@email.com",
    enterPassword: "••••••••",

    // Dental Chat
    dentalAssistant: "Dental Assistant",
    typeMessage: "Type your message...",
    send: "Send",
    welcomeMessage: "Hello! I'm DentiBot. How can I help you today? 🦷",
    detailedWelcomeMessage: `Welcome to First Smile AI! 🦷✨

I'm your AI dental assistant, available 24/7 to help you with:

🤖 **AI Chat** - Get instant answers to your dental questions
📅 **Smart Booking** - Book appointments intelligently with duration info
📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  
👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members

💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!

How can I help you today?`,
    detailedWelcomeMessageWithName: (
      name: string,
    ) => `Welcome to First Smile AI! 🦷✨

Hello ${name}! I'm your AI dental assistant, available 24/7 to help you with:

🤖 **AI Chat** - Get instant answers to your dental questions
📅 **Smart Booking** - Book appointments intelligently with duration info
📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  
👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members

💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!

How can I help you today?`,

    // Landing page
    intelligentDentalAssistant: "Your Intelligent Dental Assistant 24/7",
    experienceFuture:
      "Experience the future of dental care with AI-powered consultations, smart appointment booking, and personalized treatment recommendations. Available 24/7 to help you maintain your perfect smile.",
    viewOurDentists: "View Our Dentists",
    aiDiagnosis: "AI Diagnosis",
    aiDiagnosisDesc: "Get instant AI-powered assessments",
    smartBooking: "Smart Booking",
    smartBookingDesc: "Book appointments intelligently",
    support24_7: "24/7 Support",
    support24_7Desc: "Round-the-clock assistance",
    initializingExperience: "Initializing your experience",
    preparingAssistant:
      "Preparing your personalized dental assistant powered by advanced AI technology",

    // Navigation
    chat: "Chat",
    appointments: "Appointments",

    // Appointment booking
    bookAppointment: "Book Appointment",
    bookConsultationDescription:
      "Book your dental consultation in just a few clicks",
    chooseDentist: "Choose Dentist",
    selectDate: "Select Date",
    selectTime: "Select Time",
    availableSlots: "Available Slots",
    consultationReason: "Consultation Reason",
    generalConsultation: "General consultation",
    routineCheckup: "Routine checkup",
    dentalPain: "Dental pain",
    emergency: "Emergency",
    cleaning: "Cleaning",
    other: "Other",
    bookNow: "Book Now",
    appointmentConfirmed: "Appointment confirmed!",
    errorTitle: "Error",
    cannotLoadSlots: "Unable to load available slots",
    cannotLoadDentists: "Unable to load dentist list",
    missingInformation: "Missing information",
    selectDentistDateTime: "Please select a dentist, date and time",
    slotNoLongerAvailable: "This slot is no longer available",
    cannotCreateAppointment: "Unable to create appointment",

    // Appointments list
    myAppointments: "My Appointments",
    appointmentHistory: "Appointment History",
    upcomingAppointments: "Upcoming Appointments",
    pastAppointments: "Past Appointments",
    newAppointment: "New",
    appointmentDetails: "Appointment Details",
    loading: "Loading...",
    noUpcomingAppointments: "No upcoming appointments",
    noPastAppointments: "No past appointments",
    reschedule: "Reschedule",
    cancelAppointment: "Cancel",
    confirmCancellation: "Cancel Appointment",
    confirmCancellationMessage:
      "Are you sure you want to cancel this appointment? This action cannot be undone.",
    keepAppointment: "Keep Appointment",
    yesCancelAppointment: "Yes, Cancel",
    appointmentCancelled: "Appointment cancelled successfully",
    failedToCancelAppointment: "Failed to cancel appointment",

    // Chat commands & integration
    showMyAppointments: "Here are your appointments:",
    nextAppointment: "Your next appointment is:",
    suggestedTime: (dentist: string, time: string) =>
      `Based on your preferences, I suggest ${time} with ${dentist}`,
    wouldYouLikeToBook: "Would you like to book this appointment?",
    seeOtherOptions: "See other options",
    appointmentSuggestion: (dentist: string, date: string, time: string) =>
      `📅 Available: ${date} at ${time} with ${dentist}`,
    bookThisSlot: "Book this slot",
    showOtherTimes: "Show other times",
    settingsUpdated: "Settings Updated",
    preferencesChanged: "Your preferences have been updated",

    // Error handling
    microphoneError: "Microphone Error",
    cameraError: "Camera Error",
    mediaAccessDenied:
      "Media access was denied. Please check your browser settings.",
    mediaNotSupported: "Media features are not supported on this device.",
    tryAgain: "Try Again",

    // Privacy & validation
    privacyPolicyLink: "Privacy Policy",
    dataHandlingInfo: "Learn how we handle your personal and medical data.",
    invalidPhoneFormat: "Please enter a valid phone number",
    invalidEmailFormat: "Please enter a valid email address",
    requiredField: "This field is required",
    consentHealthData: "I consent to DentiBot processing my personal and health data for appointment scheduling and dental service support purposes.",
    childConsentNote: "If you are entering data for a patient under 16, you confirm you are their parent or legal guardian and consent to processing their data.",
    downloadMyData: "Download My Data",
    deleteAccount: "Delete My Account & Data",
    deleteAccountConfirm: "Deleting your account will permanently remove all your personal and health data from DentiBot's systems. This cannot be undone. Are you sure?",
    aiAdviceDisclaimer: "⚠️ AI suggestions are for informational purposes only and are not a substitute for professional dental advice.",

    // Onboarding
    welcomeToFirstSmile: "Welcome to First Smile AI! 🦷",
    yourAIDentalAssistant: "Your AI Dental Assistant",
    onboardingIntro:
      "I'm here to help you with all your dental needs, 24/7. This preview shows how First Smile AI will work in the real world.",
    smartFeaturesService: "Smart Features at Your Service",
    aiChat: "AI Chat",
    aiChatDesc: "Get instant answers to dental questions",
    photoAnalysis: "Photo Analysis",
    photoAnalysisDesc: "Upload photos for AI analysis",
    familyCare: "Family Care",
    familyCareDesc: "Book for family members too",
    bookForFamilyTitle: "Book for Anyone in Your Family",
    familyFriendlyBooking: "Family-Friendly Booking",
    bookForYourself: "Book appointments for yourself",
    bookForChildren: "Book for your children",
    bookForFamily: "Book for family members",
    alwaysTellDuration:
      "I'll always tell you appointment duration and end time",
    readyToStart: "Ready to Get Started?",
    youreAllSet: "You're All Set! 🎉",
    onboardingEnd:
      "Start chatting with me below to book appointments, ask questions, or get dental advice.",
    proTip: "💡 Pro Tip:",
    proTipText:
      "Just tell me what's bothering you, and I'll guide you through everything!",
    letsStart: "Let's Start!",
    next: "Next",
    back: "Back",
    previewNotice:
      "This is a working preview of First Smile AI ready for real-world use.",
    aiDisclaimer: "This assistant uses AI. Double check any medical advice.",
    acceptTerms: "I accept the Terms and Conditions",
    viewTerms: "View Terms",
    termsTitle: "Terms and Conditions",
    termsIntro:
      "Please read these terms carefully before using First Smile AI.",
    termsUse: "Use this service responsibly and respect others.",
    termsPrivacy: "We handle your data according to our privacy policy.",
    termsMedical: "Always consult a professional for serious medical concerns.",

    // Language selection
    selectPreferredLanguage: "Select Your Preferred Language",
    languageSelectionDescription:
      "Choose your language to get started with First Smile AI",

    // Emergency Triage
    'triage.title': "Emergency Dental Triage",
  },
  fr: {
    // Error & status messages
    error: "Erreur",
    success: "Succès",
    microphoneAccessError:
      "Impossible d'accéder au microphone. Veuillez vérifier les autorisations de votre navigateur et réessayer.",
    transcriptionFailed:
      "Échec de la transcription vocale. Veuillez réessayer ou taper votre message.",
    voiceProcessingError:
      "Erreur lors du traitement du message vocal. Veuillez réessayer.",

    // General
    settings: "Paramètres",
    general: "Général",
    theme: "Thème",
    personal: "Personnel",
    language: "Langue préférée",
    light: "Clair",
    dark: "Sombre",
    save: "Enregistrer",
    confirm: "Confirmer",
    cancel: "Annuler",
    close: "Fermer",
    retry: "Réessayer",

    // Personal Info
    firstName: "Prénom",
    lastName: "Nom de famille",
    phoneNumber: "Numéro de téléphone",
    dateOfBirth: "Date de naissance",
    medicalHistory: "Antécédents médicaux",
    personalInformation: "Informations personnelles",
    savePersonalInfo: "Enregistrer les informations personnelles",
    address: "Adresse",
    emergencyContact: "Contact d'urgence",
    enterAddress: "Entrez votre adresse",
    enterEmergencyContact: "Entrez les informations de contact d'urgence",

    // Messages
    languageUpdated: "Langue mise à jour",
    languageChangedTo: "Langue changée en",
    themeUpdated: "Thème mis à jour",
    switchedToMode: "Basculé en mode",
    personalInfoSaved: "Informations personnelles enregistrées",
    personalInfoUpdated: "Vos informations ont été mises à jour avec succès.",
    informationConfirmed: "Informations Confirmées",
    changesSaved: "Modifications Enregistrées",
    privacyNotice:
      "Vos données personnelles et médicales sont protégées selon notre politique de confidentialité.",

    // Auth
    signOut: "Se déconnecter",
    signIn: "Connexion",
    signUp: "Inscription",
    createAccount: "Créer un compte",
    email: "Email",
    password: "Mot de passe",
    phone: "Téléphone",
    optional: "optionnel",
    welcome: "Bienvenue",
    accessDentiBot: "Accès à DentiBot",
    signInOrCreate: "Connectez-vous ou créez un compte pour commencer",
    signInButton: "Se connecter",
    createAccountButton: "Créer un compte",
    accountCreatedSuccess: "Compte créé avec succès !",
    checkEmailConfirm: "Vérifiez votre email pour confirmer votre compte.",
    signUpError: "Erreur lors de l'inscription",
    signInError: "Erreur lors de la connexion",
    signInSuccess: "Connexion réussie !",
    welcomeToDentiBot: "Bienvenue sur DentiBot.",

    // Placeholders
    enterFirstName: "Entrez votre prénom",
    enterLastName: "Entrez votre nom de famille",
    enterPhoneNumber: "Entrez votre numéro de téléphone",
    enterMedicalHistory:
      "Entrez les antécédents médicaux pertinents, allergies, médicaments, etc.",
    selectLanguage: "Sélectionner la langue",
    enterEmail: "votre@email.com",
    enterPassword: "••••••••",

    // Dental Chat
    dentalAssistant: "Assistant dentaire",
    typeMessage: "Tapez votre message...",
    send: "Envoyer",
    welcomeMessage:
      "Bonjour ! Je suis DentiBot. Comment puis-je vous aider aujourd'hui ? 🦷",
    detailedWelcomeMessage: `Bienvenue sur First Smile AI ! 🦷✨

Je suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :

🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires
📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée
📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA
👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille

💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !

Comment puis-je vous aider aujourd'hui ?`,
    detailedWelcomeMessageWithName: (
      name: string,
    ) => `Bienvenue sur First Smile AI ! 🦷✨

Bonjour ${name} ! Je suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :

🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires
📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée
📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA
👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille

💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !

Comment puis-je vous aider aujourd'hui ?`,

    // Landing page
    intelligentDentalAssistant: "Votre Assistant Dentaire Intelligent 24h/24",
    experienceFuture:
      "Découvrez l'avenir des soins dentaires avec des consultations IA, une prise de rendez-vous intelligente et des recommandations de traitement personnalisées. Disponible 24h/24 pour vous aider à maintenir votre sourire parfait.",
    viewOurDentists: "Voir Nos Dentistes",
    aiDiagnosis: "Diagnostic IA",
    aiDiagnosisDesc: "Obtenez des évaluations instantanées alimentées par l'IA",
    smartBooking: "Réservation Intelligente",
    smartBookingDesc: "Réservez des rendez-vous intelligemment",
    support24_7: "Support 24h/24",
    support24_7Desc: "Assistance permanente",
    initializingExperience: "Initialisation de votre expérience",
    preparingAssistant:
      "Préparation de votre assistant dentaire personnalisé alimenté par une technologie IA avancée",

    // Navigation
    chat: "Chat",
    appointments: "Rendez-vous",

    // Appointment booking
    bookAppointment: "Prendre Rendez-vous",
    bookConsultationDescription:
      "Réservez votre consultation dentaire en quelques clics",
    chooseDentist: "Choisir un Dentiste",
    selectDate: "Sélectionner une Date",
    selectTime: "Sélectionner l'Heure",
    availableSlots: "Créneaux Disponibles",
    consultationReason: "Motif de Consultation",
    generalConsultation: "Consultation générale",
    routineCheckup: "Contrôle de routine",
    dentalPain: "Douleur dentaire",
    emergency: "Urgence",
    cleaning: "Nettoyage",
    other: "Autre",
    bookNow: "Réserver Maintenant",
    appointmentConfirmed: "Rendez-vous confirmé !",
    errorTitle: "Erreur",
    cannotLoadSlots: "Impossible de charger les créneaux disponibles",
    cannotLoadDentists: "Impossible de charger la liste des dentistes",
    missingInformation: "Informations manquantes",
    selectDentistDateTime:
      "Veuillez sélectionner un dentiste, une date et une heure",
    slotNoLongerAvailable: "Ce créneau n'est plus disponible",
    cannotCreateAppointment: "Impossible de créer le rendez-vous",

    // Appointments list
    myAppointments: "Mes Rendez-vous",
    appointmentHistory: "Historique des Rendez-vous",
    upcomingAppointments: "Rendez-vous à Venir",
    pastAppointments: "Rendez-vous Passés",
    newAppointment: "Nouveau",
    appointmentDetails: "Détails du Rendez-vous",
    loading: "Chargement...",
    noUpcomingAppointments: "Aucun rendez-vous à venir",
    noPastAppointments: "Aucun rendez-vous passé",
    reschedule: "Reprogrammer",
    cancelAppointment: "Annuler",
    confirmCancellation: "Annuler le Rendez-vous",
    confirmCancellationMessage:
      "Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action ne peut pas être annulée.",
    keepAppointment: "Garder le Rendez-vous",
    yesCancelAppointment: "Oui, Annuler",
    appointmentCancelled: "Rendez-vous annulé avec succès",
    failedToCancelAppointment: "Échec de l'annulation du rendez-vous",

    // Chat commands & integration
    showMyAppointments: "Voici vos rendez-vous :",
    nextAppointment: "Votre prochain rendez-vous est :",
    suggestedTime: (dentist: string, time: string) =>
      `Selon vos préférences, je suggère ${time} avec ${dentist}`,
    wouldYouLikeToBook: "Souhaitez-vous réserver ce rendez-vous ?",
    seeOtherOptions: "Voir d'autres options",
    appointmentSuggestion: (dentist: string, date: string, time: string) =>
      `📅 Disponible : ${date} à ${time} avec ${dentist}`,
    bookThisSlot: "Réserver ce créneau",
    showOtherTimes: "Afficher d'autres horaires",
    settingsUpdated: "Paramètres Mis à Jour",
    preferencesChanged: "Vos préférences ont été mises à jour",

    // Error handling
    microphoneError: "Erreur de Microphone",
    cameraError: "Erreur de Caméra",
    mediaAccessDenied:
      "L'accès aux médias a été refusé. Veuillez vérifier les paramètres de votre navigateur.",
    mediaNotSupported:
      "Les fonctionnalités multimédias ne sont pas prises en charge sur cet appareil.",
    tryAgain: "Réessayer",

    // Privacy & validation
    privacyPolicyLink: "Politique de Confidentialité",
    dataHandlingInfo:
      "Découvrez comment nous gérons vos données personnelles et médicales.",
    invalidPhoneFormat: "Veuillez entrer un numéro de téléphone valide",
    invalidEmailFormat: "Veuillez entrer une adresse email valide",
    requiredField: "Ce champ est obligatoire",
    consentHealthData: "Je consens à ce que DentiBot traite mes données personnelles et de santé pour la prise de rendez-vous et le support des services dentaires.",
    childConsentNote: "Si vous saisissez des données pour un patient de moins de 16 ans, vous confirmez être son parent ou tuteur légal et consentez au traitement de ses données.",
    downloadMyData: "Télécharger Mes Données",
    deleteAccount: "Supprimer Mon Compte et Mes Données",
    deleteAccountConfirm: "La suppression de votre compte effacera définitivement toutes vos données personnelles et de santé des systèmes de DentiBot. Cette action est irréversible. Êtes-vous sûr ?",
    aiAdviceDisclaimer: "⚠️ Les suggestions de l'IA sont fournies à titre informatif uniquement et ne remplacent pas les conseils dentaires professionnels.",

    // Onboarding
    welcomeToFirstSmile: "Bienvenue sur First Smile AI ! 🦷",
    yourAIDentalAssistant: "Votre Assistant Dentaire IA",
    onboardingIntro:
      "Je suis là pour vous aider avec tous vos besoins dentaires, 24h/24. Cette préversion montre comment First Smile AI fonctionnera dans le monde réel.",
    smartFeaturesService: "Fonctionnalités Intelligentes à Votre Service",
    aiChat: "Chat IA",
    aiChatDesc: "Obtenez des réponses instantanées aux questions dentaires",
    photoAnalysis: "Analyse Photo",
    photoAnalysisDesc: "Téléchargez des photos pour une analyse IA",
    familyCare: "Soins Familiaux",
    familyCareDesc: "Réservez aussi pour les membres de la famille",
    bookForFamilyTitle: "Réservez pour Toute Votre Famille",
    familyFriendlyBooking: "Réservation Familiale",
    bookForYourself: "Réservez des rendez-vous pour vous-même",
    bookForChildren: "Réservez pour vos enfants",
    bookForFamily: "Réservez pour les membres de la famille",
    alwaysTellDuration:
      "Je vous indiquerai toujours la durée du rendez-vous et l'heure de fin",
    readyToStart: "Prêt à Commencer ?",
    youreAllSet: "Vous êtes Prêt ! 🎉",
    onboardingEnd:
      "Commencez à discuter avec moi ci-dessous pour prendre des rendez-vous, poser des questions ou obtenir des conseils dentaires.",
    proTip: "💡 Astuce Pro :",
    proTipText:
      "Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !",
    letsStart: "Commençons !",
    next: "Suivant",
    back: "Retour",
    previewNotice:
      "Ceci est une préversion fonctionnelle de First Smile AI prête pour le monde réel.",
    aiDisclaimer:
      "Cet assistant utilise l'IA. Vérifiez toujours les conseils médicaux.",
    acceptTerms: "J'accepte les Conditions Générales",
    viewTerms: "Voir les Conditions",
    termsTitle: "Conditions Générales",
    termsIntro:
      "Veuillez lire attentivement ces conditions avant d'utiliser First Smile AI.",
    termsUse:
      "Utilisez ce service de manière responsable et respectez les autres.",
    termsPrivacy:
      "Nous traitons vos données conformément à notre politique de confidentialité.",
    termsMedical:
      "Consultez toujours un professionnel pour les problèmes médicaux sérieux.",

    // Language selection
    selectPreferredLanguage: "Sélectionnez Votre Langue Préférée",
    languageSelectionDescription:
      "Choisissez votre langue pour commencer avec First Smile AI",

    // Emergency Triage
    'triage.title': "Triage Dentaire d'Urgence",
  },
  nl: {
    // Error & status messages
    error: "Fout",
    success: "Succes",
    microphoneAccessError:
      "Kan geen toegang krijgen tot de microfoon. Controleer uw browserrechten en probeer opnieuw.",
    transcriptionFailed:
      "Spraaktranscriptie mislukt. Probeer opnieuw of typ uw bericht.",
    voiceProcessingError:
      "Fout bij het verwerken van spraakbericht. Probeer opnieuw.",

    // General
    settings: "Instellingen",
    general: "Algemeen",
    theme: "Thema",
    personal: "Persoonlijk",
    language: "Voorkeurstaal",
    light: "Licht",
    dark: "Donker",
    save: "Opslaan",
    confirm: "Bevestigen",
    cancel: "Annuleren",
    close: "Sluiten",
    retry: "Opnieuw proberen",

    // Personal Info
    firstName: "Voornaam",
    lastName: "Achternaam",
    phoneNumber: "Telefoonnummer",
    dateOfBirth: "Geboortedatum",
    medicalHistory: "Medische voorgeschiedenis",
    personalInformation: "Persoonlijke informatie",
    savePersonalInfo: "Persoonlijke informatie opslaan",
    address: "Adres",
    emergencyContact: "Noodcontact",
    enterAddress: "Voer uw adres in",
    enterEmergencyContact: "Voer noodcontactinformatie in",

    // Messages
    languageUpdated: "Taal bijgewerkt",
    languageChangedTo: "Taal gewijzigd naar",
    themeUpdated: "Thema bijgewerkt",
    switchedToMode: "Overgeschakeld naar",
    personalInfoSaved: "Persoonlijke informatie opgeslagen",
    personalInfoUpdated: "Uw informatie is succesvol bijgewerkt.",
    informationConfirmed: "Informatie Bevestigd",
    changesSaved: "Wijzigingen Opgeslagen",
    privacyNotice:
      "Uw persoonlijke en medische gegevens zijn beschermd volgens ons privacybeleid.",

    // Auth
    signOut: "Uitloggen",
    signIn: "Inloggen",
    signUp: "Registreren",
    createAccount: "Account aanmaken",
    email: "E-mail",
    password: "Wachtwoord",
    phone: "Telefoon",
    optional: "optioneel",
    welcome: "Welkom",
    accessDentiBot: "Toegang tot DentiBot",
    signInOrCreate: "Log in of maak een account aan om te beginnen",
    signInButton: "Inloggen",
    createAccountButton: "Account aanmaken",
    accountCreatedSuccess: "Account succesvol aangemaakt!",
    checkEmailConfirm: "Controleer uw e-mail om uw account te bevestigen.",
    signUpError: "Registratiefout",
    signInError: "Inlogfout",
    signInSuccess: "Inloggen gelukt!",
    welcomeToDentiBot: "Welkom bij DentiBot.",

    // Placeholders
    enterFirstName: "Voer uw voornaam in",
    enterLastName: "Voer uw achternaam in",
    enterPhoneNumber: "Voer uw telefoonnummer in",
    enterMedicalHistory:
      "Voer relevante medische voorgeschiedenis, allergieën, medicijnen, etc. in",
    selectLanguage: "Selecteer taal",
    enterEmail: "uw@email.com",
    enterPassword: "••••••••",

    // Dental Chat
    dentalAssistant: "Tandheelkundige assistent",
    typeMessage: "Typ uw bericht...",
    send: "Versturen",
    welcomeMessage: "Hallo! Ik ben DentiBot. Hoe kan ik u vandaag helpen? 🦷",
    detailedWelcomeMessage: `Welkom bij First Smile AI! 🦷✨

Ik ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:

🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen
📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie
📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse
👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden

💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!

Hoe kan ik u vandaag helpen?`,
    detailedWelcomeMessageWithName: (
      name: string,
    ) => `Welkom bij First Smile AI! 🦷✨

Hallo ${name}! Ik ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:

🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen
📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie
📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse
👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden

💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!

Hoe kan ik u vandaag helpen?`,

    // Landing page
    intelligentDentalAssistant:
      "Uw Intelligente Tandheelkundige Assistent 24/7",
    experienceFuture:
      "Ervaar de toekomst van tandheelkundige zorg met AI-consultaties, slimme afspraakplanning en gepersonaliseerde behandelingsaanbevelingen. 24/7 beschikbaar om u te helpen uw perfecte glimlach te behouden.",
    viewOurDentists: "Bekijk Onze Tandartsen",
    aiDiagnosis: "AI Diagnose",
    aiDiagnosisDesc: "Krijg direct AI-ondersteunde beoordelingen",
    smartBooking: "Slimme Boekingen",
    smartBookingDesc: "Boek afspraken intelligent",
    support24_7: "24/7 Ondersteuning",
    support24_7Desc: "Hulp rond de klok",
    initializingExperience: "Uw ervaring wordt geïnitialiseerd",
    preparingAssistant:
      "Uw gepersonaliseerde tandheelkundige assistent wordt voorbereid met geavanceerde AI-technologie",

    // Navigation
    chat: "Chat",
    appointments: "Afspraken",

    // Appointment booking
    bookAppointment: "Afspraak Maken",
    bookConsultationDescription:
      "Boek uw tandheelkundige consultatie in slechts een paar klikken",
    chooseDentist: "Kies Tandarts",
    selectDate: "Selecteer Datum",
    selectTime: "Selecteer Tijd",
    availableSlots: "Beschikbare Tijdsloten",
    consultationReason: "Reden voor Consultatie",
    generalConsultation: "Algemene consultatie",
    routineCheckup: "Routine controle",
    dentalPain: "Tandpijn",
    emergency: "Spoed",
    cleaning: "Reiniging",
    other: "Anders",
    bookNow: "Nu Boeken",
    appointmentConfirmed: "Afspraak bevestigd!",
    errorTitle: "Fout",
    cannotLoadSlots: "Kan beschikbare tijdsloten niet laden",
    cannotLoadDentists: "Kan tandartslijst niet laden",
    missingInformation: "Ontbrekende informatie",
    selectDentistDateTime: "Selecteer een tandarts, datum en tijd",
    slotNoLongerAvailable: "Dit tijdslot is niet meer beschikbaar",
    cannotCreateAppointment: "Kan afspraak niet maken",

    // Appointments list
    myAppointments: "Mijn Afspraken",
    appointmentHistory: "Afsprakengeschiedenis",
    upcomingAppointments: "Komende Afspraken",
    pastAppointments: "Vorige Afspraken",
    newAppointment: "Nieuw",
    appointmentDetails: "Afspraak Details",
    loading: "Laden...",
    noUpcomingAppointments: "Geen komende afspraken",
    noPastAppointments: "Geen vorige afspraken",
    reschedule: "Herplannen",
    cancelAppointment: "Annuleren",
    confirmCancellation: "Afspraak Annuleren",
    confirmCancellationMessage:
      "Weet u zeker dat u deze afspraak wilt annuleren? Deze actie kan niet ongedaan worden gemaakt.",
    keepAppointment: "Afspraak Behouden",
    yesCancelAppointment: "Ja, Annuleren",
    appointmentCancelled: "Afspraak succesvol geannuleerd",
    failedToCancelAppointment: "Fout bij het annuleren van de afspraak",

    // Chat commands & integration
    showMyAppointments: "Hier zijn uw afspraken:",
    nextAppointment: "Uw volgende afspraak is:",
    suggestedTime: (dentist: string, time: string) =>
      `Op basis van uw voorkeuren stel ik ${time} voor met ${dentist}`,
    wouldYouLikeToBook: "Wilt u deze afspraak boeken?",
    seeOtherOptions: "Zie andere opties",
    appointmentSuggestion: (dentist: string, date: string, time: string) =>
      `📅 Beschikbaar: ${date} om ${time} met ${dentist}`,
    bookThisSlot: "Boek dit tijdslot",
    showOtherTimes: "Toon andere tijden",
    settingsUpdated: "Instellingen Bijgewerkt",
    preferencesChanged: "Uw voorkeuren zijn bijgewerkt",

    // Error handling
    microphoneError: "Microfoon Fout",
    cameraError: "Camera Fout",
    mediaAccessDenied:
      "Media toegang is geweigerd. Controleer uw browserinstellingen.",
    mediaNotSupported: "Mediafuncties worden niet ondersteund op dit apparaat.",
    tryAgain: "Probeer Opnieuw",

    // Privacy & validation
    privacyPolicyLink: "Privacybeleid",
    dataHandlingInfo:
      "Leer hoe we uw persoonlijke en medische gegevens behandelen.",
    invalidPhoneFormat: "Voer een geldig telefoonnummer in",
    invalidEmailFormat: "Voer een geldig e-mailadres in",
    requiredField: "Dit veld is verplicht",
    consentHealthData: "Ik stem ermee in dat DentiBot mijn persoonlijke- en gezondheidsgegevens verwerkt voor het plannen van afspraken en ondersteuning van tandheelkundige diensten.",
    childConsentNote: "Als u gegevens invoert voor een patiënt jonger dan 16 jaar, bevestigt u dat u hun ouder of wettelijke voogd bent en toestemt met de verwerking van hun gegevens.",
    downloadMyData: "Mijn Gegevens Downloaden",
    deleteAccount: "Mijn Account en Gegevens Verwijderen",
    deleteAccountConfirm: "Het verwijderen van uw account verwijdert al uw persoonlijke- en gezondheidsgegevens permanent uit de systemen van DentiBot. Dit kan niet ongedaan worden gemaakt. Weet u het zeker?",
    aiAdviceDisclaimer: "⚠️ AI-suggesties zijn alleen voor informatiedoeleinden en vervangen geen professioneel tandheelkundig advies.",

    // Onboarding
    welcomeToFirstSmile: "Welkom bij First Smile AI! 🦷",
    yourAIDentalAssistant: "Uw AI Tandheelkundige Assistent",
    onboardingIntro:
      "Ik ben er om u te helpen met al uw tandheelkundige behoeften, 24/7. Deze preview toont hoe First Smile AI in de echte wereld zal werken.",
    smartFeaturesService: "Slimme Functies Tot Uw Dienst",
    aiChat: "AI Chat",
    aiChatDesc: "Krijg directe antwoorden op tandheelkundige vragen",
    photoAnalysis: "Foto Analyse",
    photoAnalysisDesc: "Upload foto's voor AI-analyse",
    familyCare: "Familiezorg",
    familyCareDesc: "Boek ook voor familieleden",
    bookForFamilyTitle: "Boek voor Iedereen in Uw Familie",
    familyFriendlyBooking: "Familievriendelijke Boekingen",
    bookForYourself: "Boek afspraken voor uzelf",
    bookForChildren: "Boek voor uw kinderen",
    bookForFamily: "Boek voor familieleden",
    alwaysTellDuration:
      "Ik zal u altijd de duur van de afspraak en eindtijd vertellen",
    readyToStart: "Klaar om te Beginnen?",
    youreAllSet: "U bent Klaar! 🎉",
    onboardingEnd:
      "Begin hieronder met me te chatten om afspraken te maken, vragen te stellen of tandheelkundige adviezen te krijgen.",
    proTip: "💡 Pro Tip:",
    proTipText:
      "Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!",
    letsStart: "Laten we Beginnen!",
    next: "Volgende",
    back: "Terug",
    previewNotice:
      "Dit is een werkende preview van First Smile AI klaar voor gebruik in de echte wereld.",
    aiDisclaimer:
      "Deze assistent gebruikt AI. Controleer altijd medisch advies.",
    acceptTerms: "Ik accepteer de Algemene Voorwaarden",
    viewTerms: "Bekijk de Voorwaarden",
    termsTitle: "Algemene Voorwaarden",
    termsIntro:
      "Lees deze voorwaarden zorgvuldig door voordat u First Smile AI gebruikt.",
    termsUse: "Gebruik deze dienst verantwoordelijk en respecteer anderen.",
    termsPrivacy: "Wij behandelen uw gegevens volgens ons privacybeleid.",
    termsMedical:
      "Raadpleeg altijd een professional voor serieuze medische vragen.",

    // Language selection
    selectPreferredLanguage: "Selecteer Uw Voorkeurstaal",
    languageSelectionDescription:
      "Kies uw taal om te beginnen met First Smile AI",

    // Emergency Triage
    'triage.title': "Spoed Tandheelkundige Triage",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  currentLanguage: string;
  changeLanguage: (lang: "en" | "fr" | "nl") => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const changeLanguage = (lang: "en" | "fr" | "nl") => {
  localStorage.setItem("preferred-language", lang);
  // Force page reload to apply language changes
  window.location.reload();
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "preferred-language",
    ) as Language;
    if (savedLanguage && ["en", "fr", "nl"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("preferred-language", lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        currentLanguage: language,
        changeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
