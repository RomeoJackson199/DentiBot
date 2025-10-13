import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

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
  startConsultation: string;
  emergencyAssistance: string;
  language: string;
  light: string;
  dark: string;
  save: string;
  confirm: string;
  cancel: string;
  close: string;
  retry: string;
  
  // Booking & schedule additions
  selectDentist: string;
  selectAppointmentType: string;
  appointmentType: string;
  confirmBooking: string;
  booking: string;
  bookAppointmentDescription: string;
  describeSymptoms: string;
  noSlotsAvailable: string;
  unableToLoadSlots: string;
  unableToBookAppointment: string;
  pleaseCompleteAllFields: string;
  incompleteProfile: string;
  pleaseCompleteProfileFirst: string;
  appointmentBooked: string;
  weeklyAvailability: string;
  workingHours: string;
  breakTime: string;
  saveAvailability: string;
  availabilityUpdated: string;
  failedToLoadAvailability: string;
  failedToSaveAvailability: string;
  saving: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;

  // Vacation & Schedule Management
  availabilityManagement: string;
  weeklySchedule: string;
  vacationsAbsences: string;
  weeklyPlanning: string;
  quickPresets: string;
  presetMonFri: string;
  presetMonSat: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  addVacation: string;
  startDate: string;
  endDate: string;
  vacationType: string;
  scheduledVacations: string;
  loadingSettings: string;
  vacationsTypeVacation: string;
  vacationsTypeSick: string;
  vacationsTypePersonal: string;
  addButton: string;
  noVacationsScheduled: string;
  deleteVacation: string;
  day: string;
  days: string;

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
  noAppointmentsFound: string;
  viewMore: string;
  showLess: string;
  more: string;
  reschedule: string;
  cancelAppointment: string;
  confirmCancellation: string;
  confirmCancellationMessage: string;
  keepAppointment: string;
  yesCancelAppointment: string;
  appointmentCancelled: string;
  failedToCancelAppointment: string;
  
  // Appointments Management
  appointmentsManagement: string;
  manageViewAppointments: string;
  refresh: string;
  searchByPatient: string;
  todayPlus7Days: string;
  nextWeek: string;
  nextMonth: string;
  allTime: string;
  thisWeek: string;
  thisMonth: string;
  allStatus: string;
  pending: string;
  time: string;
  patient: string;
  status: string;
  actions: string;
  view: string;
  notRegisteredDentist: string;
  contactSupport: string;
  todaysAppointments: string;
  urgentCases: string;
  completionRate: string;
  highPriority: string;
  estimatedRevenue: string;
  avg: string;
  statusOverview: string;
  generalConsultationLower: string;

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

  // Appointment Details Dialog
  appointmentDetailsTitle: string;
  appointmentInformation: string;
  urgency: string;
  reason: string;
  completed: string;
  notes: string;
  consultationNotes: string;
  additionalNotes: string;
  medicalRecords: string;
  prescriptions: string;
  billingInformation: string;
  findings: string;
  recommendations: string;
  prescribed: string;
  invoice: string;
  download: string;
  patientAmount: string;
  vat: string;
  total: string;
  created: string;
  failedToLoadDetails: string;

  // Patient Dashboard Components  
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  hereIsYourHealthOverview: string;
  confirmed: string;
  join: string;
  activeMedications: string;
  viewInCareTab: string;
  balance: string;
  due: string;
  amountDue: string;
  allPaid: string;
  payNow: string;
  aiAssistant: string;
  getInstantHelpWith: string;
  bookingAppointments: string;
  dentalQuestions: string;
  emergencyTriage: string;
  startChat: string;
  dailyTipsReminders: string;
  morningReminder: string;
  dontForgetToBrush: string;
  healthTip: string;
  flossingDaily: string;
  upcoming: string;
  dentalCleaningRecommended: string;
  healthStats: string;
  healthRating: string;
  excellent: string;
  visitsThisYear: string;
  onTrack: string;
  coverageUsed: string;
  remaining: string;
  healthImproved: string;
  lastSixMonths: string;
  treatmentPlans: string;
  manageDentalVisits: string;
  bookNew: string;
  active: string;
  mainClinic: string;
  generalCheckup: string;
  today: string;
  calendar: string;
  list: string;
  history: string;
  cancelled: string;
  scheduled: string;

  // Dentist Dashboard
  loadingDentistDashboard: string;
  notRegisteredAsDentist: string;
  dentiDashboard: string;
  dentistPortal: string;
  loadingDentistProfile: string;
  // AppShell & Navigation
  navClinical: string;
  navBusiness: string;
  navOperations: string;
  navAdmin: string;
  navDashboard: string;
  navAppointments: string;
  navPatients: string;
  navPayments: string;
  navAnalytics: string;
  navInventory: string;
  navImport: string;
  navSchedule: string;
  navSettings: string;
  navReports?: string;
  navBrandingLoc?: string;
  navSecurity?: string;
  topSearch: string;
  topClinic: string;
  topProfile: string;

  // Patient portal navigation (pnav.*)
  pnav: {
    group: {
      care: string;
      billing: string;
      documents: string;
      account: string;
    };
    care: {
      home: string;
      appointments: string;
      prescriptions: string;
      history: string;
    };
    billing: {
      main: string;
    };
    docs: {
      main: string;
    };
    account: {
      profile: string;
      insurance: string;
      privacy: string;
      help: string;
    };
  };

  // Dentist: Clinical appointment UI
  completeAppointment: string;
  prescriptionsShort: string;
  paymentsShort: string;
  viewAll: string;
  collapse: string;
  expand: string;
  srAlertNew: string;
  srQuickActions: string;
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
  intelligentDentalAssistant: "Intelligent Dental Assistant",
  experienceFuture: "Experience the Future",
  viewOurDentists: "View Our Dentists",
  aiDiagnosis: "AI Diagnosis",
  startConsultation: "Start Consultation",
  bookAppointment: "Book Appointment",
  emergencyAssistance: "Emergency Assistance",
    language: "Preferred Language",
    light: "Light",
    dark: "Dark",
    save: "Save",
    confirm: "Confirm",
    cancel: "Cancel",
    close: "Close",
    retry: "Retry",

    // Booking & schedule additions
    selectDentist: "Select Dentist",
    selectAppointmentType: "Select appointment type",
    appointmentType: "Appointment Type",
    confirmBooking: "Confirm Booking",
    booking: "Booking...",
    bookAppointmentDescription: "Book your dental consultation in a few clicks",
    describeSymptoms: "Describe your symptoms or concerns...",
    noSlotsAvailable: "No slots available for this date",
    unableToLoadSlots: "Unable to load available slots",
    unableToBookAppointment: "Unable to book appointment",
    pleaseCompleteAllFields: "Please complete all required fields",
    incompleteProfile: "Incomplete Profile",
    pleaseCompleteProfileFirst: "Please complete your profile in settings before booking an appointment",
    appointmentBooked: "Appointment booked successfully",
    weeklyAvailability: "Weekly Availability",
    workingHours: "Working Hours",
    breakTime: "Break Time",
    saveAvailability: "Save Availability",
    availabilityUpdated: "Availability updated successfully",
    failedToLoadAvailability: "Failed to load availability",
    failedToSaveAvailability: "Failed to save availability",
    saving: "Saving...",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",

    // Vacation & Schedule Management
    availabilityManagement: "Availability Management",
    weeklySchedule: "Weekly Schedule",
    vacationsAbsences: "Vacations & Absences",
    weeklyPlanning: "Weekly Planning",
    quickPresets: "Quick presets:",
    presetMonFri: "Mon-Fri 9am-5pm",
    presetMonSat: "Mon-Sat 8am-6pm",
    startTime: "Start",
    endTime: "End",
    breakStart: "Break start",
    breakEnd: "Break end",
    addVacation: "Add Vacation",
    startDate: "Start date",
    endDate: "End date",
    vacationType: "Vacation type",
    scheduledVacations: "Scheduled vacations",
    loadingSettings: "Loading settings...",
    vacationsTypeVacation: "Vacation",
    vacationsTypeSick: "Sick Leave",
    vacationsTypePersonal: "Personal Leave",
    addButton: "Add",
    noVacationsScheduled: "No vacations scheduled",
    deleteVacation: "Delete",
    day: "day",
    days: "days",

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
    noAppointmentsFound: "No appointments found",
    viewMore: "View More",
    showLess: "Show Less",
    more: "more",
    reschedule: "Reschedule",
    cancelAppointment: "Cancel",
    confirmCancellation: "Cancel Appointment",
    confirmCancellationMessage:
      "Are you sure you want to cancel this appointment? This action cannot be undone.",
    keepAppointment: "Keep Appointment",
    yesCancelAppointment: "Yes, Cancel",
    appointmentCancelled: "Appointment cancelled successfully",
    failedToCancelAppointment: "Failed to cancel appointment",
    
    // Appointments Management
    appointmentsManagement: "Appointments Management",
    manageViewAppointments: "Manage and view all your patient appointments",
    refresh: "Refresh",
    searchByPatient: "Search by patient name, reason, or notes...",
    todayPlus7Days: "Today + 7 days",
    nextWeek: "Next Week",
    nextMonth: "Next Month",
    allTime: "All Time",
    thisWeek: "This Week",
    thisMonth: "This Month",
    allStatus: "All Status",
    pending: "Pending",
    time: "Time",
    patient: "Patient",
    status: "Status",
    actions: "Actions",
    view: "View",
    notRegisteredDentist: "You are not registered as a dentist. Please contact support.",
    contactSupport: "Contact Support",
    todaysAppointments: "Today's Appointments",
    urgentCases: "Urgent Cases",
    completionRate: "Completion Rate",
    highPriority: "High priority appointments",
    estimatedRevenue: "Revenue (Estimated)",
    avg: "Avg",
    statusOverview: "Status Overview",
    generalConsultationLower: "General consultation",

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

    // Appointment Details Dialog
    appointmentDetailsTitle: "Appointment Details",
    appointmentInformation: "Appointment Information",
    urgency: "urgency",
    reason: "Reason:",
    completed: "Completed:",
    notes: "Notes",
    consultationNotes: "Consultation Notes",
    additionalNotes: "Additional Notes",
    medicalRecords: "Medical Records",
    prescriptions: "Prescriptions",
    billingInformation: "Billing Information",
    findings: "Findings:",
    recommendations: "Recommendations:",
    prescribed: "Prescribed:",
    invoice: "Invoice",
    download: "Download",
    patientAmount: "Patient Amount:",
    vat: "VAT:",
    total: "Total:",
    created: "Created:",
    failedToLoadDetails: "Failed to load appointment details",

    // Patient Dashboard Components
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon", 
    goodEvening: "Good evening",
    hereIsYourHealthOverview: "Here's your health overview",
    confirmed: "Confirmed",
    join: "Join",
    activeMedications: "Active medications",
    viewInCareTab: "View in Care tab",
    balance: "Balance",
    due: "Due",
    amountDue: "Amount due",
    allPaid: "All paid",
    payNow: "Pay Now",
    aiAssistant: "AI Assistant",
    getInstantHelpWith: "Get instant help with:",
    bookingAppointments: "Booking appointments",
    dentalQuestions: "Dental questions",
    emergencyTriage: "Emergency triage",
    startChat: "Start Chat",
    dailyTipsReminders: "Daily Tips & Reminders",
    morningReminder: "Morning Reminder",
    dontForgetToBrush: "Don't forget to brush for 2 minutes",
    healthTip: "Health Tip",
    flossingDaily: "Flossing daily reduces gum disease by 40%",
    upcoming: "Upcoming",
    dentalCleaningRecommended: "Dental cleaning recommended in 2 months",
    healthStats: "Health Stats",
    healthRating: "Health Rating",
    excellent: "Excellent",
    visitsThisYear: "Visits This Year",
    onTrack: "On track",
    coverageUsed: "Coverage Used",
    remaining: "remaining",
    healthImproved: "Health Improved",
    lastSixMonths: "Last 6 months",
    treatmentPlans: "Treatment Plans",
    manageDentalVisits: "Manage your dental visits",
    bookNew: "Book New",
    active: "Active",
    mainClinic: "Main Clinic",
    generalCheckup: "General Checkup",
    today: "Today",
    calendar: "Calendar",
    list: "List", 
    history: "History",
    cancelled: "Cancelled",
    scheduled: "Scheduled",

    // Dentist Dashboard
    loadingDentistDashboard: "Loading dentist dashboard...",
    notRegisteredAsDentist: "You are not registered as a dentist. Please contact support.",
    dentiDashboard: "Denti Dashboard",
    dentistPortal: "Dentist Portal",
    loadingDentistProfile: "Loading dentist profile...",
    // AppShell & Navigation
    navClinical: "Clinical",
    navBusiness: "Business",
    navOperations: "Operations",
    navAdmin: "Admin",
    navDashboard: "Dashboard",
    navAppointments: "Appointments",
    navPatients: "Patients",
    navPayments: "Payments",
    navAnalytics: "Analytics",
    // Added missing labels
    navReports: "Reports",
    navInventory: "Inventory",
    navImport: "Import",
    navSchedule: "Schedule",
    navSettings: "Settings",
    navBrandingLoc: "Branding & Localization",
    navSecurity: "Privacy & Security",
    topSearch: "Search",
    topClinic: "Clinic",
    topProfile: "Profile",
    // Patient portal navigation (pnav.*)
    pnav: {
      group: {
        care: "Care",
        billing: "Billing",
        documents: "Documents",
        account: "Account",
      },
      care: {
        home: "Home",
        appointments: "Appointments",
        prescriptions: "Prescriptions",
        history: "Treatment History",
      },
      billing: { main: "Invoices & Payments" },
      docs: { main: "My Documents" },
      account: {
        profile: "Profile & Settings",
        insurance: "Insurance / Mutuality",
        privacy: "Privacy & Security",
        help: "Help & Support",
      },
    },

    // Dentist: Clinical appointment UI
    completeAppointment: "Complete Appointment",
    prescriptionsShort: "Prescriptions",
    paymentsShort: "Payments",
    viewAll: "View all",
    collapse: "Collapse",
    expand: "Expand",
    srAlertNew: "New critical alert",
    srQuickActions: "Quick actions toolbar",
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
    startConsultation: "Commencer la consultation",
    emergencyAssistance: "Assistance d'urgence",
    language: "Langue préférée",
    light: "Clair",
    dark: "Sombre",
    save: "Enregistrer",
    confirm: "Confirmer",
    cancel: "Annuler",
    close: "Fermer",
    retry: "Réessayer",

    // Booking & schedule additions
    selectDentist: "Sélectionner un Dentiste",
    selectAppointmentType: "Sélectionner le type de rendez-vous",
    appointmentType: "Type de Rendez-vous",
    confirmBooking: "Confirmer la Réservation",
    booking: "Réservation en cours...",
    bookAppointmentDescription: "Réservez votre consultation dentaire en quelques clics",
    describeSymptoms: "Décrivez vos symptômes ou préoccupations...",
    noSlotsAvailable: "Aucun créneau disponible pour cette date",
    unableToLoadSlots: "Impossible de charger les créneaux disponibles",
    unableToBookAppointment: "Impossible de réserver le rendez-vous",
    pleaseCompleteAllFields: "Veuillez remplir tous les champs obligatoires",
    incompleteProfile: "Profil Incomplet",
    pleaseCompleteProfileFirst: "Veuillez compléter votre profil dans les paramètres avant de prendre rendez-vous",
    appointmentBooked: "Rendez-vous réservé avec succès",
    weeklyAvailability: "Disponibilité Hebdomadaire",
    workingHours: "Heures de Travail",
    breakTime: "Pause",
    saveAvailability: "Enregistrer la Disponibilité",
    availabilityUpdated: "Disponibilité mise à jour avec succès",
    failedToLoadAvailability: "Échec du chargement de la disponibilité",
    failedToSaveAvailability: "Échec de l'enregistrement de la disponibilité",
    saving: "Sauvegarde...",
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",

    // Vacation & Schedule Management
    availabilityManagement: "Gestion des Disponibilités",
    weeklySchedule: "Horaires hebdomadaires",
    vacationsAbsences: "Congés & Absences",
    weeklyPlanning: "Planification hebdomadaire",
    quickPresets: "Presets rapides:",
    presetMonFri: "Lun-Ven 9h-17h",
    presetMonSat: "Lun-Sam 8h-18h",
    startTime: "Début",
    endTime: "Fin",
    breakStart: "Pause début",
    breakEnd: "Pause fin",
    addVacation: "Ajouter un congé",
    startDate: "Date de début",
    endDate: "Date de fin",
    vacationType: "Type de congé",
    scheduledVacations: "Congés programmés",
    loadingSettings: "Chargement des paramètres...",
    vacationsTypeVacation: "Vacances",
    vacationsTypeSick: "Congé maladie",
    vacationsTypePersonal: "Congé personnel",
    addButton: "Ajouter",
    noVacationsScheduled: "Aucun congé programmé",
    deleteVacation: "Supprimer",
    day: "jour",
    days: "jours",

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
    noAppointmentsFound: "Aucun rendez-vous trouvé",
    viewMore: "Voir Plus",
    showLess: "Voir Moins",
    more: "plus",
    reschedule: "Reprogrammer",
    cancelAppointment: "Annuler",
    confirmCancellation: "Annuler le Rendez-vous",
    confirmCancellationMessage:
      "Êtes-vous sûr de vouloir annuler ce rendez-vous? Cette action est irréversible.",
    keepAppointment: "Conserver le Rendez-vous",
    yesCancelAppointment: "Oui, Annuler",
    appointmentCancelled: "Rendez-vous annulé avec succès",
    failedToCancelAppointment: "Échec de l'annulation du rendez-vous",
    
    // Appointments Management
    appointmentsManagement: "Gestion des Rendez-vous",
    manageViewAppointments: "Gérez et consultez tous les rendez-vous de vos patients",
    refresh: "Actualiser",
    searchByPatient: "Rechercher par nom de patient, motif ou notes...",
    todayPlus7Days: "Aujourd'hui + 7 jours",
    nextWeek: "Semaine Prochaine",
    nextMonth: "Mois Prochain",
    allTime: "Tout",
    thisWeek: "Cette Semaine",
    thisMonth: "Ce Mois",
    allStatus: "Tous les Statuts",
    pending: "En Attente",
    time: "Heure",
    patient: "Patient",
    status: "Statut",
    actions: "Actions",
    view: "Voir",
    notRegisteredDentist: "Vous n'êtes pas enregistré en tant que dentiste. Veuillez contacter le support.",
    contactSupport: "Contacter le Support",
    todaysAppointments: "Rendez-vous d'Aujourd'hui",
    urgentCases: "Cas Urgents",
    completionRate: "Taux de Complétion",
    highPriority: "Rendez-vous haute priorité",
    estimatedRevenue: "Revenu (Estimé)",
    avg: "Moy",
    statusOverview: "Aperçu des Statuts",
    generalConsultationLower: "Consultation générale",

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
      "Consultez toujours un professional pour les problèmes médicaux sérieux.",

    // Language selection
    selectPreferredLanguage: "Sélectionnez Votre Langue Préférée",
    languageSelectionDescription:
      "Choisissez votre langue pour commencer avec First Smile AI",

    // Emergency Triage
    'triage.title': "Triage Dentaire d'Urgence",

    // Appointment Details Dialog
    appointmentDetailsTitle: "Détails du Rendez-vous",
    appointmentInformation: "Informations du Rendez-vous",
    urgency: "urgence",
    reason: "Motif :",
    completed: "Terminé :",
    notes: "Notes",
    consultationNotes: "Notes de Consultation",
    additionalNotes: "Notes Supplémentaires",
    medicalRecords: "Dossiers Médicaux",
    prescriptions: "Prescriptions",
    billingInformation: "Informations de Facturation",
    findings: "Constatations :",
    recommendations: "Recommandations :",
    prescribed: "Prescrit :",
    invoice: "Facture",
    download: "Télécharger",
    patientAmount: "Montant Patient :",
    vat: "TVA :",
    total: "Total :",
    created: "Créé :",
    failedToLoadDetails: "Échec du chargement des détails du rendez-vous",

    // Patient Dashboard Components
    goodMorning: "Bonjour",
    goodAfternoon: "Bon après-midi",
    goodEvening: "Bonsoir",
    hereIsYourHealthOverview: "Voici votre aperçu santé",
    confirmed: "Confirmé",
    join: "Rejoindre",
    activeMedications: "Médicaments actifs",
    viewInCareTab: "Voir dans l'onglet Soins",
    balance: "Solde",
    due: "Dû",
    amountDue: "Montant dû",
    allPaid: "Tout payé",
    payNow: "Payer Maintenant",
    aiAssistant: "Assistant IA",
    getInstantHelpWith: "Obtenez une aide instantanée avec :",
    bookingAppointments: "Prise de rendez-vous",
    dentalQuestions: "Questions dentaires",
    emergencyTriage: "Triage d'urgence",
    startChat: "Commencer le Chat",
    dailyTipsReminders: "Conseils et Rappels Quotidiens",
    morningReminder: "Rappel Matinal",
    dontForgetToBrush: "N'oubliez pas de vous brosser les dents pendant 2 minutes",
    healthTip: "Conseil Santé",
    flossingDaily: "Utiliser le fil dentaire quotidiennement réduit les maladies des gencives de 40%",
    upcoming: "À venir",
    dentalCleaningRecommended: "Nettoyage dentaire recommandé dans 2 mois",
    healthStats: "Statistiques de Santé",
    healthRating: "Évaluation Santé",
    excellent: "Excellent",
    visitsThisYear: "Visites Cette Année",
    onTrack: "Sur la bonne voie",
    coverageUsed: "Couverture Utilisée",
    remaining: "restant",
    healthImproved: "Santé Améliorée",
    lastSixMonths: "6 derniers mois",
    treatmentPlans: "Plans de Traitement",
    manageDentalVisits: "Gérez vos visites dentaires",
    bookNew: "Nouveau",
    active: "Actif",
    mainClinic: "Clinique Principale",
    generalCheckup: "Contrôle Général",
    today: "Aujourd'hui",
    calendar: "Calendrier",
    list: "Liste",
    history: "Geschiedenis",
    cancelled: "Annulé",
    scheduled: "Programmé",

    // Dentist Dashboard
    loadingDentistDashboard: "Chargement du tableau de bord dentiste...",
    notRegisteredAsDentist: "Vous n'êtes pas enregistré comme dentiste. Veuillez contacter le support.",
    dentiDashboard: "Tableau de Bord Denti",
    dentistPortal: "Portail Dentiste",
    loadingDentistProfile: "Chargement du profil dentiste...",
    // AppShell & Navigation
    navClinical: "Clinique",
    navBusiness: "Business",
    navOperations: "Opérations",
    navAdmin: "Admin",
    navDashboard: "Tableau de bord",
    navAppointments: "Rendez-vous",
    navPatients: "Patients",
    navPayments: "Paiements",
    navAnalytics: "Analytique",
    navReports: "Rapports",
    navInventory: "Inventaire",
    navImport: "Import",
    navSchedule: "Planning",
    navSettings: "Paramètres",
    navBrandingLoc: "Image de marque & Localisation",
    navSecurity: "Confidentialité & Sécurité",
    topSearch: "Rechercher",
    topClinic: "Clinique",
    topProfile: "Profil",
    // Patient portal navigation (pnav.*)
    pnav: {
      group: {
        care: "Soins",
        billing: "Facturation",
        documents: "Documents",
        account: "Account",
      },
      care: {
        home: "Accueil",
        appointments: "Rendez-vous",
        prescriptions: "Prescriptions",
        history: "Historique des soins",
      },
      billing: { main: "Factures & Paiements" },
      docs: { main: "Mes Documents" },
      account: {
        profile: "Profiel & Instellingen",
        insurance: "Verzekering / Mutualiteit",
        privacy: "Confidentialité & Sécurité",
        help: "Aide & Support",
      },
    },

    // Dentist: Clinical appointment UI
    completeAppointment: "Terminer le Rendez-vous",
    prescriptionsShort: "Ordonnances",
    paymentsShort: "Paiements",
    viewAll: "Tout voir",
    collapse: "Réduire",
    expand: "Développer",
    srAlertNew: "Nouvelle alerte critique",
    srQuickActions: "Barre d'actions rapides",
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
    startConsultation: "Start consultatie",
    emergencyAssistance: "Noodhulp",
    intelligentDentalAssistant: "Intelligente tandheelkundige assistent",
    experienceFuture: "Ervaar de toekomst",
    viewOurDentists: "Bekijk onze tandartsen",
    aiDiagnosis: "AI Diagnose",
    aiDiagnosisDesc: "Krijg directe AI-beoordelingen",
    smartBooking: "Slim boeken",
    smartBookingDesc: "Boek afspraken intelligent",
    support24_7: "24/7 ondersteuning",
    support24_7Desc: "Hulp de klok rond",
    initializingExperience: "Ervaring initialiseren",
    preparingAssistant: "Assistent voorbereiden",
    language: "Voorkeurstaal",
    light: "Licht",
    dark: "Donker",
    save: "Opslaan",
    confirm: "Bevestigen",
    cancel: "Annuleren",
    close: "Sluiten",
    retry: "Opnieuw proberen",

    // Booking & schedule additions
    selectDentist: "Selecteer Tandarts",
    selectAppointmentType: "Selecteer type afspraak",
    appointmentType: "Type Afspraak",
    confirmBooking: "Boeking Bevestigen",
    booking: "Boeken...",
    bookAppointmentDescription: "Boek uw tandheelkundige consultatie in een paar klikken",
    describeSymptoms: "Beschrijf uw symptomen of zorgen...",
    noSlotsAvailable: "Geen tijdsloten beschikbaar voor deze datum",
    unableToLoadSlots: "Kan beschikbare tijdsloten niet laden",
    unableToBookAppointment: "Kan afspraak niet boeken",
    pleaseCompleteAllFields: "Vul alle verplichte velden in",
    incompleteProfile: "Onvolledig Profiel",
    pleaseCompleteProfileFirst: "Voltooi eerst uw profiel in de instellingen voordat u een afspraak maakt",
    appointmentBooked: "Afspraak succesvol geboekt",
    weeklyAvailability: "Wekelijkse Beschikbaarheid",
    workingHours: "Werktijden",
    breakTime: "Pauze",
    saveAvailability: "Beschikbaarheid Opslaan",
    availabilityUpdated: "Beschikbaarheid succesvol bijgewerkt",
    failedToLoadAvailability: "Kan beschikbaarheid niet laden",
    failedToSaveAvailability: "Kan beschikbaarheid niet opslaan",
    saving: "Opslaan...",
    monday: "Maandag",
    tuesday: "Dinsdag",
    wednesday: "Woensdag",
    thursday: "Donderdag",
    friday: "Vrijdag",
    saturday: "Zaterdag",
    sunday: "Zondag",

    // Vacation & Schedule Management
    availabilityManagement: "Beschikbaarheid Beheren",
    weeklySchedule: "Wekelijkse planning",
    vacationsAbsences: "Verlof & Afwezigheid",
    weeklyPlanning: "Wekelijkse planning",
    quickPresets: "Snelle presets:",
    presetMonFri: "Ma-Vr 9u-17u",
    presetMonSat: "Ma-Za 8u-18u",
    startTime: "Start",
    endTime: "Einde",
    breakStart: "Pauze start",
    breakEnd: "Pauze einde",
    addVacation: "Verlof toevoegen",
    startDate: "Startdatum",
    endDate: "Einddatum",
    vacationType: "Type verlof",
    scheduledVacations: "Geplande verloven",
    loadingSettings: "Instellingen laden...",
    vacationsTypeVacation: "Vakantie",
    vacationsTypeSick: "Ziekteverlof",
    vacationsTypePersonal: "Persoonlijk verlof",
    addButton: "Toevoegen",
    noVacationsScheduled: "Geen verlof gepland",
    deleteVacation: "Verwijderen",
    day: "dag",
    days: "dagen",

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
    detailedWelcomeMessage: "Welkom bij First Smile AI! 🦷✨\n\nIk ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:\n\n🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen\n📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie\n📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse\n👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden\n\n💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!\n\nHoe kan ik u vandaag helpen?",
    detailedWelcomeMessageWithName: (name: string) => `Welkom bij First Smile AI! 🦷✨\n\nHallo ${name}! Ik ben uw AI tandheelkundige assistent, 24/7 beschikbaar om u te helpen met:\n\n🤖 **AI Chat** - Krijg directe antwoorden op uw tandheelkundige vragen\n📅 **Slimme Boekingen** - Boek afspraken intelligent met duurduurinformatie\n📸 **Foto Analyse** - Upload foto's voor AI-aangedreven tandheelkundige analyse\n👨‍👩‍👧‍👦 **Familiezorg** - Boek afspraken voor uzelf of familieleden\n\n💡 **Pro Tip**: Vertel me gewoon wat u dwarszit, en ik zal u door alles heen begeleiden!\n\nHoe kan ik u vandaag helpen?`,

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
    noAppointmentsFound: "Geen afspraken gevonden",
    viewMore: "Meer Bekijken",
    showLess: "Minder Bekijken",
    more: "meer",
    reschedule: "Herplannen",
    cancelAppointment: "Annuleren",
    confirmCancellation: "Afspraak Annuleren",
    confirmCancellationMessage:
      "Weet u zeker dat u deze afspraak wilt annuleren? Deze actie kan niet ongedaan worden gemaakt.",
    keepAppointment: "Afspraak Behouden",
    yesCancelAppointment: "Ja, Annuleren",
    appointmentCancelled: "Afspraak succesvol geannuleerd",
    failedToCancelAppointment: "Kan afspraak niet annuleren",
    
    // Appointments Management
    appointmentsManagement: "Afspraken Beheer",
    manageViewAppointments: "Beheer en bekijk alle afspraken van uw patiënten",
    refresh: "Vernieuwen",
    searchByPatient: "Zoeken op patiëntnaam, reden of notities...",
    todayPlus7Days: "Vandaag + 7 dagen",
    nextWeek: "Volgende Week",
    nextMonth: "Volgende Maand",
    allTime: "Alle Tijd",
    thisWeek: "Deze Week",
    thisMonth: "Deze Maand",
    allStatus: "Alle Statussen",
    pending: "In Behandeling",
    time: "Tijd",
    patient: "Patiënt",
    status: "Status",
    actions: "Acties",
    view: "Bekijken",
    notRegisteredDentist: "U bent niet geregistreerd als tandarts. Neem contact op met de ondersteuning.",
    contactSupport: "Contact Opnemen",
    todaysAppointments: "Afspraken van Vandaag",
    urgentCases: "Urgente Gevallen",
    completionRate: "Voltooiingspercentage",
    highPriority: "Hoge prioriteit afspraken",
    estimatedRevenue: "Inkomsten (Geschat)",
    avg: "Gem",
    statusOverview: "Statusoverzicht",
    generalConsultationLower: "Algemene consultatie",

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
    mediaNotSupported:
      "Mediafuncties worden niet ondersteund op dit apparaat.",
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
    termsUse:
      "Utilisez deze dienst verantwoordelijk en respecteer anderen.",
    termsPrivacy:
      "Wij behandelen uw gegevens volgens ons privacybeleid.",
    termsMedical:
      "Raadpleeg altijd een professional voor serieuze medische vragen.",

    // Language selection
    selectPreferredLanguage: "Selecteer Uw Voorkeurstaal",
    languageSelectionDescription:
      "Kies uw taal om te beginnen met First Smile AI",

    // Emergency Triage
    'triage.title': "Spoed Tandheelkundige Triage",

    // Appointment Details Dialog
    appointmentDetailsTitle: "Afspraak Details",
    appointmentInformation: "Afspraak Informatie",
    urgency: "urgentie",
    reason: "Reden:",
    completed: "Voltooid:",
    notes: "Notities",
    consultationNotes: "Consultatie Notities",
    additionalNotes: "Aanvullende Notities",
    medicalRecords: "Medische Dossiers",
    prescriptions: "Voorschriften",
    billingInformation: "Factuur Informatie",
    findings: "Bevindingen:",
    recommendations: "Aanbevelingen:",
    prescribed: "Voorgeschreven:",
    invoice: "Factuur",
    download: "Downloaden",
    patientAmount: "Patiënt Bedrag:",
    vat: "BTW:",
    total: "Totaal:",
    created: "Aangemaakt:",
    failedToLoadDetails: "Kan afspraak details niet laden",

    // Patient Dashboard Components
    goodMorning: "Goedemorgen",
    goodAfternoon: "Goedemiddag",
    goodEvening: "Goedenavond",
    hereIsYourHealthOverview: "Hier is uw gezondheidsoverzicht",
    confirmed: "Bevestigd",
    join: "Deelnemen",
    activeMedications: "Actieve medicijnen",
    viewInCareTab: "Bekijk in Zorg tabblad",
    balance: "Saldo",
    due: "Verschuldigd",
    amountDue: "Verschuldigd bedrag",
    allPaid: "Alles betaald",
    payNow: "Nu Betalen",
    aiAssistant: "AI Assistent",
    getInstantHelpWith: "Krijg directe hulp bij:",
    bookingAppointments: "Afspraken maken",
    dentalQuestions: "Tandheelkundige vragen",
    emergencyTriage: "Spoed triage",
    startChat: "Commencer le Chat",
    dailyTipsReminders: "Dagelijkse Tips & Herinneringen",
    morningReminder: "Ochtend Herinnering",
    dontForgetToBrush: "Vergeet niet om 2 minuten te poetsen",
    healthTip: "Gezondheids Tip",
    flossingDaily: "Dagelijks flossen vermindert tandvleesaandoeningen met 40%",
    upcoming: "Komend",
    dentalCleaningRecommended: "Tandreiniging aanbevolen over 2 maanden",
    healthStats: "Gezondheids Statistieken",
    healthRating: "Gezondheids Beoordeling",
    excellent: "Uitstekend",
    visitsThisYear: "Bezoeken Dit Jaar",
    onTrack: "Op schema",
    coverageUsed: "Dekking Gebruikt",
    remaining: "resterend",
    healthImproved: "Gezondheid Verbeterd",
    lastSixMonths: "Laatste 6 maanden",
    treatmentPlans: "Behandelplannen",
    manageDentalVisits: "Beheer uw tandheelkundige bezoeken",
    bookNew: "Nieuwe",
    active: "Actief",
    mainClinic: "Hoofdkliniek",
    generalCheckup: "Algemene Controle",
    today: "Vandaag",
    calendar: "Kalender",
    list: "Lijst",
    history: "Geschiedenis",
    cancelled: "Geannuleerd",
    scheduled: "Gepland",

    // Dentist Dashboard
    loadingDentistDashboard: "Tandarts dashboard laden...",
    notRegisteredAsDentist: "U bent niet geregistreerd als tandarts. Neem contact op met de ondersteuning.",
    dentiDashboard: "Denti Dashboard",
    dentistPortal: "Tandarts Portaal",
    loadingDentistProfile: "Tandartsprofiel laden...",
    // AppShell & Navigation
    navClinical: "Klinisch",
    navBusiness: "Zakelijk",
    navOperations: "Operaties",
    navAdmin: "Beheer",
    navDashboard: "Tableau de bord",
    navAppointments: "Afspraken",
    navPatients: "Patiënten",
    navPayments: "Betalingen",
    navAnalytics: "Analytics",
    navReports: "Rapporten",
    navInventory: "Voorraad",
    navImport: "Import",
    navSchedule: "Schema",
    navSettings: "Instellingen",
    navBrandingLoc: "Branding & Lokalisatie",
    navSecurity: "Confidentialité & Beveiliging",
    topSearch: "Zoeken",
    topClinic: "Kliniek",
    topProfile: "Profil",
    // Patient portal navigation (pnav.*)
    pnav: {
      group: {
        care: "Zorg",
        billing: "Facturen",
        documents: "Documenten",
        account: "Account",
      },
      care: {
        home: "Home",
        appointments: "Afspraken",
        prescriptions: "Voorschriften",
        history: "Behandelgeschiedenis",
      },
      billing: { main: "Facturen & Betalingen" },
      docs: { main: "Mijn Documenten" },
      account: {
        profile: "Profiel & Instellingen",
        insurance: "Verzekering / Mutualiteit",
        privacy: "Confidentialité & Beveiliging",
        help: "Hulp & Support",
      },
    },

    // Dentist: Clinical appointment UI
    completeAppointment: "Afspraak Voltooien",
    prescriptionsShort: "Voorschr.",
    paymentsShort: "Betalingen",
    viewAll: "Alles bekijken",
    collapse: "Inklappen",
    expand: "Uitklappen",
    srAlertNew: "Nieuwe kritieke melding",
    srQuickActions: "Werkbalk snelle acties",
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
    // Fallback to profile language_preference
    if (!savedLanguage) {
      (async () => {
        try {
          const { data: user } = await supabase.auth.getUser();
          const uid = user.user?.id;
          if (!uid) return;
          const { data: profile } = await supabase
            .from('profiles')
            .select('language_preference')
            .eq('user_id', uid)
            .maybeSingle();
          const pref = (profile?.language_preference || 'en') as Language;
          if (["en","fr","nl"].includes(pref)) {
            setLanguage(pref);
          }
        } catch {}
      })();
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    console.log('Setting language to:', lang);
    setLanguage(lang);
    localStorage.setItem("preferred-language", lang);
    console.log('Language state updated, localStorage set');
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
  console.log('useLanguage called, current language:', context.language);
  return context;
};

