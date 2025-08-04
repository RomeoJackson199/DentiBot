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
  
  // Dashboard & Navigation
  dashboard: string;
  welcomeBack: string;
  welcomeToDashboard: string;
  notifications: string;
  bookAppointment: string;
  upcoming: string;
  completed: string;
  activeRx: string;
  treatmentPlans: string;
  yourAppointments: string;
  bookNewAppointment: string;
  yourPrescriptions: string;
  yourTreatmentPlans: string;
  yourRecords: string;
  yourNotes: string;
  analytics: string;
  emergency: string;
  test: string;
  
  // Settings
  generalSettings: string;
  themeSettings: string;
  personalSettings: string;
  signOut: string;
  signOutConfirm: string;
  profileIncomplete: string;
  completeProfile: string;
  aiOptOut: string;
  aiOptOutDescription: string;
  downloadData: string;
  deleteAccount: string;
  deleteAccountConfirm: string;
  deleteAccountWarning: string;
  
  // Loading & Error States
  loadingDashboard: string;
  loadingProfile: string;
  errorLoadingDashboard: string;
  errorLoadingProfile: string;
  tryAgain: string;
  determiningAccess: string;
  
  // Stats & Metrics
  appointments: string;
  prescriptions: string;
  treatmentPlans: string;
  medicalRecords: string;
  patientNotes: string;
  
  // Homepage
  poweredByAdvancedAI: string;
  available24_7: string;
  yourIntelligent: string;
  dentalAssistant: string;
  experienceFuture: string;
  aiPoweredConsultations: string;
  smartAppointmentBooking: string;
  personalizedTreatment: string;
  aiChatAssistant: string;
  getInstantAnswers: string;
  smartBooking: string;
  bookIntelligently: string;
  emergencyTriage: string;
  quickAssessment: string;
  available: string;
  accuracy: string;
  avgResponse: string;
  getStartedFree: string;
  emergencyAssessment: string;
  hipaaCompliant: string;
  secureAndPrivate: string;
  noCreditCard: string;
  
  // Feature Cards
  advancedFeatures: string;
  everythingYouNeed: string;
  futureOfDentalCare: string;
  aiPoweredFeatures: string;
  mostPopular: string;
  timeSaver: string;
  healthFocused: string;
  familyFriendly: string;
  mobileReady: string;
  secure: string;
  available24_7Feature: string;
  instantResponses: string;
  secureAndPrivateFeature: string;
  learnMore: string;
  joinThousands: string;
  startYourJourney: string;
  freeToGetStarted: string;
  fromReviews: string;
  
  // Footer
  readyToTransform: string;
  joinThousandsProfessionals: string;
  revolutionizedPatientCare: string;
  
  // Common Actions
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  view: string;
  add: string;
  remove: string;
  update: string;
  refresh: string;
  retry: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  submit: string;
  reset: string;
  search: string;
  filter: string;
  sort: string;
  
  // Status Messages
  success: string;
  error: string;
  warning: string;
  info: string;
  loading: string;
  saved: string;
  updated: string;
  deleted: string;
  created: string;
  failed: string;
  cancelled: string;
  confirmed: string;
  pending: string;
  completed: string;
  active: string;
  inactive: string;
  
  // Additional Settings
  signOutSuccess: string;
  aiFeaturesDisabled: string;
  aiFeaturesEnabled: string;
  aiFeaturesDisabledDesc: string;
  aiFeaturesEnabledDesc: string;
  failedToUpdateAiSettings: string;
  failedToSavePersonalInfo: string;
  authenticationError: string;
  networkError: string;
  unknownError: string;
  
  // Feature Descriptions
  healthRecordsManagement: string;
  healthRecordsDescription: string;
  familyCareSupport: string;
  familyCareDescription: string;
  mobileFirstExperience: string;
  mobileFirstDescription: string;
  privacyAndSecurity: string;
  privacySecurityDescription: string;
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
    
    // Dashboard & Navigation
    dashboard: "Dashboard",
    welcomeBack: "Welcome back",
    welcomeToDashboard: "Welcome to your dental health dashboard",
    notifications: "Notifications",
    bookAppointment: "Book Appointment",
    upcoming: "Upcoming",
    completed: "Completed",
    activeRx: "Active Rx",
    treatmentPlans: "Treatment Plans",
    yourAppointments: "Your Appointments",
    bookNewAppointment: "Book New Appointment",
    yourPrescriptions: "Your Prescriptions",
    yourTreatmentPlans: "Your Treatment Plans",
    yourRecords: "Your Records",
    yourNotes: "Your Notes",
    analytics: "Analytics",
    emergency: "Emergency",
    test: "Test",
    
    // Settings
    generalSettings: "General Settings",
    themeSettings: "Theme Settings",
    personalSettings: "Personal Settings",
    signOut: "Sign Out",
    signOutConfirm: "Are you sure you want to sign out?",
    profileIncomplete: "Profile Incomplete",
    completeProfile: "Complete Profile",
    aiOptOut: "AI Opt-Out",
    aiOptOutDescription: "Opt out of AI-powered features",
    downloadData: "Download My Data",
    deleteAccount: "Delete My Account & Data",
    deleteAccountConfirm: "Are you sure you want to delete your account? This action cannot be undone.",
    deleteAccountWarning: "This will permanently delete all your data.",
    
    // Loading & Error States
    loadingDashboard: "Loading Dashboard",
    loadingProfile: "Loading Profile",
    errorLoadingDashboard: "Error Loading Dashboard",
    errorLoadingProfile: "Error Loading Profile",
    tryAgain: "Try Again",
    determiningAccess: "Determining your access level and personalizing your experience...",
    
    // Stats & Metrics
    appointments: "Appointments",
    prescriptions: "Prescriptions",
    treatmentPlans: "Treatment Plans",
    medicalRecords: "Medical Records",
    patientNotes: "Patient Notes",
    
    // Homepage
    poweredByAdvancedAI: "Powered by Advanced AI",
    available24_7: "24/7 Available",
    yourIntelligent: "Your Intelligent",
    dentalAssistant: "Dental Assistant",
    experienceFuture: "Experience the future of dental care with AI-powered consultations, smart appointment booking, and personalized treatment recommendations.",
    aiPoweredConsultations: "AI-powered consultations",
    smartAppointmentBooking: "smart appointment booking",
    personalizedTreatment: "personalized treatment recommendations",
    aiChatAssistant: "AI Chat Assistant",
    getInstantAnswers: "Get instant answers to dental questions and concerns",
    smartBooking: "Smart Booking",
    bookIntelligently: "Book appointments intelligently with duration info",
    emergencyTriage: "Emergency Triage",
    quickAssessment: "Quick assessment for urgent dental situations",
    available: "Available",
    accuracy: "Accuracy",
    avgResponse: "Avg Response",
    getStartedFree: "Get Started Free",
    emergencyAssessment: "Emergency Assessment",
    hipaaCompliant: "HIPAA Compliant",
    secureAndPrivate: "Secure & Private",
    noCreditCard: "No Credit Card",
    
    // Feature Cards
    advancedFeatures: "Advanced Features",
    everythingYouNeed: "Everything You Need for Better Dental Care",
    futureOfDentalCare: "Experience the future of dental care with AI-powered features designed to make your dental journey smoother, smarter, and more convenient.",
    aiPoweredFeatures: "AI-powered features",
    mostPopular: "Most Popular",
    timeSaver: "Time Saver",
    healthFocused: "Health Focused",
    familyFriendly: "Family Friendly",
    mobileReady: "Mobile Ready",
    secure: "Secure",
    available24_7Feature: "Available 24/7",
    instantResponses: "Instant responses",
    secureAndPrivateFeature: "Secure & private",
    learnMore: "Learn more",
    joinThousands: "Join Thousands of Happy Patients",
    startYourJourney: "Start your journey to better dental health today. It's free to get started and takes less than 2 minutes!",
    freeToGetStarted: "free to get started",
    fromReviews: "4.9/5 from 2,000+ reviews",
    
    // Footer
    readyToTransform: "Ready to Transform Your Practice?",
    joinThousandsProfessionals: "Join thousands of dental professionals who have revolutionized patient care with AI.",
    revolutionizedPatientCare: "revolutionized patient care with AI",
    
    // Common Actions
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    add: "Add",
    remove: "Remove",
    update: "Update",
    refresh: "Refresh",
    retry: "Retry",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    reset: "Reset",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    
    // Status Messages
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
    loading: "Loading",
    saved: "Saved",
    updated: "Updated",
    deleted: "Deleted",
    created: "Created",
    failed: "Failed",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    active: "Active",
    inactive: "Inactive",
    
    // Additional Settings
    signOutSuccess: "You have been signed out successfully",
    aiFeaturesDisabled: "AI Features Disabled",
    aiFeaturesEnabled: "AI Features Enabled",
    aiFeaturesDisabledDesc: "AI features have been disabled for your account. You can re-enable them anytime in settings.",
    aiFeaturesEnabledDesc: "AI features have been enabled for your account.",
    failedToUpdateAiSettings: "Failed to update AI settings",
    failedToSavePersonalInfo: "Failed to save personal information",
    authenticationError: "Authentication error. Please try logging in again.",
    networkError: "Network error. Please check your connection.",
    unknownError: "Unknown error occurred",
    
    // Feature Descriptions
    healthRecordsManagement: "Health Records Management",
    healthRecordsDescription: "Keep track of your dental health with comprehensive medical history and treatment plan management.",
    familyCareSupport: "Family Care Support",
    familyCareDescription: "Book appointments for your entire family. Manage multiple profiles with ease and convenience.",
    mobileFirstExperience: "Mobile-First Experience",
    mobileFirstDescription: "Perfect experience on any device with PWA technology for native app-like performance and offline access.",
    privacyAndSecurity: "Privacy & Security",
    privacySecurityDescription: "HIPAA/GDPR compliant with end-to-end encryption and secure data handling for your peace of mind.",
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
    
    // Dashboard & Navigation
    dashboard: "Tableau de Bord",
    welcomeBack: "Bon retour",
    welcomeToDashboard: "Bienvenue sur votre tableau de bord de santé dentaire",
    notifications: "Notifications",
    bookAppointment: "Prendre Rendez-vous",
    upcoming: "À venir",
    completed: "Terminé",
    activeRx: "Rx Actifs",
    treatmentPlans: "Plans de Traitement",
    yourAppointments: "Vos Rendez-vous",
    bookNewAppointment: "Prendre un Nouveau Rendez-vous",
    yourPrescriptions: "Vos Prescriptions",
    yourTreatmentPlans: "Vos Plans de Traitement",
    yourRecords: "Vos Dossiers",
    yourNotes: "Vos Notes",
    analytics: "Analyses",
    emergency: "Urgence",
    test: "Test",
    
    // Settings
    generalSettings: "Paramètres Généraux",
    themeSettings: "Paramètres de Thème",
    personalSettings: "Paramètres Personnels",
    signOut: "Se Déconnecter",
    signOutConfirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
    profileIncomplete: "Profil Incomplet",
    completeProfile: "Compléter le Profil",
    aiOptOut: "Désactivation IA",
    aiOptOutDescription: "Désactiver les fonctionnalités alimentées par l'IA",
    downloadData: "Télécharger Mes Données",
    deleteAccount: "Supprimer Mon Compte et Mes Données",
    deleteAccountConfirm: "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action ne peut pas être annulée.",
    deleteAccountWarning: "Cela supprimera définitivement toutes vos données.",
    
    // Loading & Error States
    loadingDashboard: "Chargement du Tableau de Bord",
    loadingProfile: "Chargement du Profil",
    errorLoadingDashboard: "Erreur de Chargement du Tableau de Bord",
    errorLoadingProfile: "Erreur de Chargement du Profil",
    tryAgain: "Réessayer",
    determiningAccess: "Détermination de votre niveau d'accès et personnalisation de votre expérience...",
    
    // Stats & Metrics
    appointments: "Rendez-vous",
    prescriptions: "Prescriptions",
    treatmentPlans: "Plans de Traitement",
    medicalRecords: "Dossiers Médicaux",
    patientNotes: "Notes du Patient",
    
    // Homepage
    poweredByAdvancedAI: "Alimenté par l'IA Avancée",
    available24_7: "Disponible 24h/24",
    yourIntelligent: "Votre Assistant",
    dentalAssistant: "Dentaire Intelligent",
    experienceFuture: "Découvrez l'avenir des soins dentaires avec des consultations IA, une prise de rendez-vous intelligente et des recommandations de traitement personnalisées.",
    aiPoweredConsultations: "consultations alimentées par l'IA",
    smartAppointmentBooking: "prise de rendez-vous intelligente",
    personalizedTreatment: "recommandations de traitement personnalisées",
    aiChatAssistant: "Assistant Chat IA",
    getInstantAnswers: "Obtenez des réponses instantanées à vos questions et préoccupations dentaires",
    smartBooking: "Réservation Intelligente",
    bookIntelligently: "Réservez des rendez-vous intelligemment avec les informations de durée",
    emergencyTriage: "Triage d'Urgence",
    quickAssessment: "Évaluation rapide pour les situations dentaires urgentes",
    available: "Disponible",
    accuracy: "Précision",
    avgResponse: "Réponse Moy",
    getStartedFree: "Commencer Gratuitement",
    emergencyAssessment: "Évaluation d'Urgence",
    hipaaCompliant: "Conforme HIPAA",
    secureAndPrivate: "Sécurisé et Privé",
    noCreditCard: "Pas de Carte de Crédit",
    
    // Feature Cards
    advancedFeatures: "Fonctionnalités Avancées",
    everythingYouNeed: "Tout Ce Dont Vous Avez Besoin pour de Meilleurs Soins Dentaires",
    futureOfDentalCare: "Découvrez l'avenir des soins dentaires avec des fonctionnalités alimentées par l'IA conçues pour rendre votre parcours dentaire plus fluide, plus intelligent et plus pratique.",
    aiPoweredFeatures: "fonctionnalités alimentées par l'IA",
    mostPopular: "Le Plus Populaire",
    timeSaver: "Gain de Temps",
    healthFocused: "Centré sur la Santé",
    familyFriendly: "Familial",
    mobileReady: "Prêt Mobile",
    secure: "Sécurisé",
    available24_7Feature: "Disponible 24h/24",
    instantResponses: "Réponses instantanées",
    secureAndPrivateFeature: "Sécurisé et privé",
    learnMore: "En savoir plus",
    joinThousands: "Rejoignez des Milliers de Patients Heureux",
    startYourJourney: "Commencez votre parcours vers une meilleure santé dentaire aujourd'hui. C'est gratuit pour commencer et prend moins de 2 minutes !",
    freeToGetStarted: "gratuit pour commencer",
    fromReviews: "4,9/5 de plus de 2 000 avis",
    
    // Footer
    readyToTransform: "Prêt à Transformer Votre Pratique ?",
    joinThousandsProfessionals: "Rejoignez des milliers de professionnels dentaires qui ont révolutionné les soins aux patients avec l'IA.",
    revolutionizedPatientCare: "révolutionné les soins aux patients avec l'IA",
    
    // Common Actions
    save: "Enregistrer",
    cancel: "Annuler",
    confirm: "Confirmer",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    add: "Ajouter",
    remove: "Supprimer",
    update: "Mettre à Jour",
    refresh: "Actualiser",
    retry: "Réessayer",
    close: "Fermer",
    back: "Retour",
    next: "Suivant",
    previous: "Précédent",
    submit: "Soumettre",
    reset: "Réinitialiser",
    search: "Rechercher",
    filter: "Filtrer",
    sort: "Trier",
    
    // Status Messages
    success: "Succès",
    error: "Erreur",
    warning: "Avertissement",
    info: "Info",
    loading: "Chargement",
    saved: "Enregistré",
    updated: "Mis à Jour",
    deleted: "Supprimé",
    created: "Créé",
    failed: "Échoué",
    cancelled: "Annulé",
    confirmed: "Confirmé",
    pending: "En Attente",
    completed: "Terminé",
    active: "Actif",
    inactive: "Inactif",
    
    // Additional Settings
    signOutSuccess: "Vous avez été déconnecté avec succès",
    aiFeaturesDisabled: "Fonctionnalités IA Désactivées",
    aiFeaturesEnabled: "Fonctionnalités IA Activées",
    aiFeaturesDisabledDesc: "Les fonctionnalités IA ont été désactivées pour votre compte. Vous pouvez les réactiver à tout moment dans les paramètres.",
    aiFeaturesEnabledDesc: "Les fonctionnalités IA ont été activées pour votre compte.",
    failedToUpdateAiSettings: "Échec de la mise à jour des paramètres IA",
    failedToSavePersonalInfo: "Échec de l'enregistrement des informations personnelles",
    authenticationError: "Erreur d'authentification. Veuillez essayer de vous reconnecter.",
    networkError: "Erreur réseau. Veuillez vérifier votre connexion.",
    unknownError: "Une erreur inconnue s'est produite",
    
    // Feature Descriptions
    healthRecordsManagement: "Gestion des Dossiers Médicaux",
    healthRecordsDescription: "Suivez votre santé dentaire avec un historique médical complet et la gestion des plans de traitement.",
    familyCareSupport: "Support des Soins Familiaux",
    familyCareDescription: "Réservez des rendez-vous pour toute votre famille. Gérez plusieurs profils avec facilité et commodité.",
    mobileFirstExperience: "Expérience Mobile-First",
    mobileFirstDescription: "Expérience parfaite sur n'importe quel appareil avec la technologie PWA pour des performances natives et un accès hors ligne.",
    privacyAndSecurity: "Confidentialité et Sécurité",
    privacySecurityDescription: "Conforme HIPAA/GDPR avec chiffrement de bout en bout et gestion sécurisée des données pour votre tranquillité d'esprit.",
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
    
    // Dashboard & Navigation
    dashboard: "Dashboard",
    welcomeBack: "Welkom terug",
    welcomeToDashboard: "Welkom op uw tandheelkundige gezondheidsdashboard",
    notifications: "Meldingen",
    bookAppointment: "Afspraak Maken",
    upcoming: "Aankomend",
    completed: "Voltooid",
    activeRx: "Actieve Rx",
    treatmentPlans: "Behandelingsplannen",
    yourAppointments: "Uw Afspraken",
    bookNewAppointment: "Nieuwe Afspraak Maken",
    yourPrescriptions: "Uw Voorschriften",
    yourTreatmentPlans: "Uw Behandelingsplannen",
    yourRecords: "Uw Dossiers",
    yourNotes: "Uw Notities",
    analytics: "Analyses",
    emergency: "Spoed",
    test: "Test",
    
    // Settings
    generalSettings: "Algemene Instellingen",
    themeSettings: "Thema Instellingen",
    personalSettings: "Persoonlijke Instellingen",
    signOut: "Uitloggen",
    signOutConfirm: "Weet u zeker dat u wilt uitloggen?",
    profileIncomplete: "Profiel Onvolledig",
    completeProfile: "Profiel Voltooien",
    aiOptOut: "AI Uitschakelen",
    aiOptOutDescription: "Schakel AI-aangedreven functies uit",
    downloadData: "Mijn Gegevens Downloaden",
    deleteAccount: "Mijn Account en Gegevens Verwijderen",
    deleteAccountConfirm: "Weet u zeker dat u uw account wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
    deleteAccountWarning: "Dit zal al uw gegevens permanent verwijderen.",
    
    // Loading & Error States
    loadingDashboard: "Dashboard Laden",
    loadingProfile: "Profiel Laden",
    errorLoadingDashboard: "Fout bij het Laden van Dashboard",
    errorLoadingProfile: "Fout bij het Laden van Profiel",
    tryAgain: "Opnieuw Proberen",
    determiningAccess: "Uw toegangsniveau bepalen en uw ervaring personaliseren...",
    
    // Stats & Metrics
    appointments: "Afspraken",
    prescriptions: "Voorschriften",
    treatmentPlans: "Behandelingsplannen",
    medicalRecords: "Medische Dossiers",
    patientNotes: "Patiëntnotities",
    
    // Homepage
    poweredByAdvancedAI: "Aangedreven door Geavanceerde AI",
    available24_7: "24/7 Beschikbaar",
    yourIntelligent: "Uw Intelligente",
    dentalAssistant: "Tandheelkundige Assistent",
    experienceFuture: "Ervaar de toekomst van tandheelkundige zorg met AI-consultaties, slimme afspraakplanning en gepersonaliseerde behandelingsaanbevelingen.",
    aiPoweredConsultations: "AI-consultaties",
    smartAppointmentBooking: "slimme afspraakplanning",
    personalizedTreatment: "gepersonaliseerde behandelingsaanbevelingen",
    aiChatAssistant: "AI Chat Assistent",
    getInstantAnswers: "Krijg directe antwoorden op tandheelkundige vragen en zorgen",
    smartBooking: "Slimme Boekingen",
    bookIntelligently: "Boek afspraken intelligent met duurduurinformatie",
    emergencyTriage: "Spoed Triage",
    quickAssessment: "Snelle beoordeling voor urgente tandheelkundige situaties",
    available: "Beschikbaar",
    accuracy: "Nauwkeurigheid",
    avgResponse: "Gem Resp",
    getStartedFree: "Gratis Beginnen",
    emergencyAssessment: "Spoed Beoordeling",
    hipaaCompliant: "HIPAA Conform",
    secureAndPrivate: "Veilig en Privé",
    noCreditCard: "Geen Creditcard",
    
    // Feature Cards
    advancedFeatures: "Geavanceerde Functies",
    everythingYouNeed: "Alles Wat U Nodig Heeft voor Betere Tandheelkundige Zorg",
    futureOfDentalCare: "Ervaar de toekomst van tandheelkundige zorg met AI-functies ontworpen om uw tandheelkundige reis soepeler, slimmer en handiger te maken.",
    aiPoweredFeatures: "AI-functies",
    mostPopular: "Meest Populair",
    timeSaver: "Tijdbesparend",
    healthFocused: "Gezondheidsgericht",
    familyFriendly: "Gezinsvriendelijk",
    mobileReady: "Mobiel Klaar",
    secure: "Veilig",
    available24_7Feature: "24/7 Beschikbaar",
    instantResponses: "Directe antwoorden",
    secureAndPrivateFeature: "Veilig en privé",
    learnMore: "Meer informatie",
    joinThousands: "Doe Mee met Duizenden Blije Patiënten",
    startYourJourney: "Begin vandaag uw reis naar betere tandheelkundige gezondheid. Het is gratis om te beginnen en duurt minder dan 2 minuten!",
    freeToGetStarted: "gratis om te beginnen",
    fromReviews: "4,9/5 van meer dan 2.000 beoordelingen",
    
    // Footer
    readyToTransform: "Klaar om Uw Praktijk te Transformeren?",
    joinThousandsProfessionals: "Doe mee met duizenden tandheelkundige professionals die patiëntenzorg hebben gerevolutioneerd met AI.",
    revolutionizedPatientCare: "patiëntenzorg hebben gerevolutioneerd met AI",
    
    // Common Actions
    save: "Opslaan",
    cancel: "Annuleren",
    confirm: "Bevestigen",
    delete: "Verwijderen",
    edit: "Bewerken",
    view: "Bekijken",
    add: "Toevoegen",
    remove: "Verwijderen",
    update: "Bijwerken",
    refresh: "Vernieuwen",
    retry: "Opnieuw Proberen",
    close: "Sluiten",
    back: "Terug",
    next: "Volgende",
    previous: "Vorige",
    submit: "Indienen",
    reset: "Resetten",
    search: "Zoeken",
    filter: "Filteren",
    sort: "Sorteren",
    
    // Status Messages
    success: "Succes",
    error: "Fout",
    warning: "Waarschuwing",
    info: "Info",
    loading: "Laden",
    saved: "Opgeslagen",
    updated: "Bijgewerkt",
    deleted: "Verwijderd",
    created: "Aangemaakt",
    failed: "Mislukt",
    cancelled: "Geannuleerd",
    confirmed: "Bevestigd",
    pending: "In Afwachting",
    completed: "Voltooid",
    active: "Actief",
    inactive: "Inactief",
    
    // Additional Settings
    signOutSuccess: "U bent succesvol uitgelogd",
    aiFeaturesDisabled: "AI Functies Uitgeschakeld",
    aiFeaturesEnabled: "AI Functies Ingeschakeld",
    aiFeaturesDisabledDesc: "AI-functies zijn uitgeschakeld voor uw account. U kunt ze altijd weer inschakelen in de instellingen.",
    aiFeaturesEnabledDesc: "AI-functies zijn ingeschakeld voor uw account.",
    failedToUpdateAiSettings: "Fout bij het bijwerken van AI-instellingen",
    failedToSavePersonalInfo: "Fout bij het opslaan van persoonlijke informatie",
    authenticationError: "Authenticatiefout. Probeer opnieuw in te loggen.",
    networkError: "Netwerkfout. Controleer uw verbinding.",
    unknownError: "Er is een onbekende fout opgetreden",
    
    // Feature Descriptions
    healthRecordsManagement: "Gezondheidsdossierbeheer",
    healthRecordsDescription: "Houd uw tandheelkundige gezondheid bij met uitgebreide medische geschiedenis en behandelingsplanbeheer.",
    familyCareSupport: "Familiezorg Ondersteuning",
    familyCareDescription: "Boek afspraken voor uw hele gezin. Beheer meerdere profielen met gemak en comfort.",
    mobileFirstExperience: "Mobiel-Eerst Ervaring",
    mobileFirstDescription: "Perfecte ervaring op elk apparaat met PWA-technologie voor native app-achtige prestaties en offline toegang.",
    privacyAndSecurity: "Privacy en Beveiliging",
    privacySecurityDescription: "HIPAA/GDPR-compliant met end-to-end encryptie en veilige gegevensverwerking voor uw gemoedsrust.",
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
