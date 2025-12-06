
export type Language = "en" | "fr" | "nl";

export const SUPPORTED_LANGUAGES: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export interface Translations {
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
    accessCaberu: string;
    signInOrCreate: string;
    signInButton: string;
    createAccountButton: string;
    accountCreatedSuccess: string;
    checkEmailConfirm: string;
    signUpError: string;
    signInError: string;
    signInSuccess: string;
    welcomeToCaberu: string;

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
    'triage.subtitle': string;
    'triage.pain.title': string;
    'triage.pain.question': string;
    'triage.pain.none': string;
    'triage.pain.severe': string;
    'triage.symptoms.title': string;
    'triage.symptoms.bleeding': string;
    'triage.symptoms.swelling': string;
    'triage.symptoms.fever': string;
    'triage.symptoms.difficulty': string;
    'triage.symptoms.trauma': string;
    'triage.duration.title': string;
    'triage.duration.question': string;
    'triage.duration.hours': string;
    'triage.duration.day': string;
    'triage.duration.days': string;
    'triage.duration.week': string;
    'triage.medical.title': string;
    'triage.medical.diabetes': string;
    'triage.medical.heart': string;
    'triage.medical.blood': string;
    'triage.medical.immune': string;
    'triage.submit': string;
    'triage.result.emergency': string;
    'triage.result.high': string;
    'triage.result.medium': string;
    'triage.result.low': string;

    // Booking Triage
    'booking.title': string;
    'booking.earliest': string;
    'booking.confirm': string;
    'booking.success': string;
    'booking.detailsTitle': string;
    'booking.dentist': string;
    'booking.date': string;
    'booking.time': string;
    'booking.urgency': string;
    'booking.urgentArrivalNotice': string;
    'booking.continue': string;
    'booking.selectDate': string;
    'booking.availableTimes': string;
    'booking.noSlots': string;
    'booking.selectDatePrompt': string;
    'booking.selectedDentist': string;
    'booking.selectedBadge': string;

    // Emergency Triage Entry
    'entry.heroTitle': string;
    'entry.heroDesc': string;
    'entry.ctaStart': string;
    'entry.steps.assessSymptoms.title': string;
    'entry.steps.assessSymptoms.desc': string;
    'entry.steps.getUrgency.title': string;
    'entry.steps.getUrgency.desc': string;
    'entry.steps.viewSlots.title': string;
    'entry.steps.viewSlots.desc': string;
    'entry.steps.bookInstantly.title': string;
    'entry.steps.bookInstantly.desc': string;
    'entry.emergencyNotice.title': string;
    'entry.emergencyNotice.desc': string;
    'entry.gdpr.title': string;
    'entry.gdpr.desc': string;
    'entry.return': string;
    'entry.stats.minutes': string;
    'entry.stats.quick': string;
    'entry.stats.gdpr': string;
    'entry.stats.secure': string;
    'entry.stats.directBooking': string;
    'entry.stats.noChat': string;

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
    past: string;
    book: string;
    dentalCleaningRecommended: string;
    healthRecords: string;
    rewards: string;
    quicklyBookViewRecords: string;
    yourTreatmentsWillAppear: string;
    unpaid: string;
    paid: string;
    statements: string;
    paidInvoices: string;
    downloadStatements: string;
    viewManageMedications: string;
    upload: string;
    shareLink: string;
    insuranceProvider: string;
    insuranceProviderPlaceholder: string;
    policyNumber: string;
    policyNumberPlaceholder: string;
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
    navReports: string;
    navBrandingLoc: string;
    navSecurity: string;
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

    // Treatment records
    searchTreatments: string;
    filterByType: string;
    allTypes: string;
    consultation: string;
    treatment: string;
    xray: string;
    labResult: string;
    dentist: string;
    treatmentType: string;
    date: string;
    noRecordsFound: string;
    appointmentRescheduled: string;
    savedSuccessfully: string;

    // Common
    'common.cancel': string;
    'common.next': string;
    'common.back': string;
    'common.loading': string;
    'common.success': string;
}

export const translations: Record<Language, Translations> = {
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
        accessCaberu: "Access Caberu",
        signInOrCreate: "Sign in or create an account to get started",
        signInButton: "Sign in",
        createAccountButton: "Create account",
        accountCreatedSuccess: "Account created successfully!",
        checkEmailConfirm: "Check your email to confirm your account.",
        signUpError: "Sign up error",
        signInError: "Sign in error",
        signInSuccess: "Sign in successful!",
        welcomeToCaberu: "Welcome to Caberu.",

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
        welcomeMessage: "Hello! I'm Caberu. How can I help you today? 🦷",
        detailedWelcomeMessage: "Welcome to First Smile AI! 🦷✨\n\nI'm your AI dental assistant, available 24/7 to help you with:\n\n🤖 **AI Chat** - Get instant answers to your dental questions\n📅 **Smart Booking** - Book appointments intelligently with duration info\n📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  \n👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members\n\n💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!\n\nHow can I help you today?",
        detailedWelcomeMessageWithName: (
            name: string,
        ) => `Welcome to First Smile AI! 🦷✨\n\nHello ${name}! I'm your AI dental assistant, available 24/7 to help you with:\n\n🤖 **AI Chat** - Get instant answers to your dental questions\n📅 **Smart Booking** - Book appointments intelligently with duration info\n📸 **Photo Analysis** - Upload photos for AI-powered dental analysis  \n👨‍👩‍👧‍👦 **Family Care** - Book appointments for yourself or family members\n\n💡 **Pro Tip**: Just tell me what's bothering you, and I'll guide you through everything!\n\nHow can I help you today?`,

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
        consentHealthData: "I consent to Caberu processing my personal and health data for appointment scheduling and dental service support purposes.",
        childConsentNote: "If you are entering data for a patient under 16, you confirm you are their parent or legal guardian and consent to processing their data.",
        downloadMyData: "Download My Data",
        deleteAccount: "Delete My Account & Data",
        deleteAccountConfirm: "Deleting your account will permanently remove all your personal and health data from Caberu's systems. This cannot be undone. Are you sure?",
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

        // Booking Triage
        'booking.title': 'Book Your Appointment',
        'booking.earliest': 'Earliest Available Slots',
        'booking.confirm': 'Confirm Appointment',
        'booking.success': 'Appointment booked successfully!',
        'booking.detailsTitle': 'Appointment Details',
        'booking.dentist': 'Dentist',
        'booking.date': 'Date',
        'booking.time': 'Time',
        'booking.urgency': 'Urgency',
        'booking.urgentArrivalNotice': 'Due to the urgent nature of your case, please arrive 15 minutes early. If your condition worsens, please contact emergency services immediately.',
        'booking.continue': 'Continue to Dashboard',
        'booking.selectDate': 'Select Date',
        'booking.availableTimes': 'Available Times',
        'booking.noSlots': 'No available slots for this date',
        'booking.selectDatePrompt': 'Please select a date to view available times',
        'booking.selectedDentist': 'Selected dentist',
        'booking.selectedBadge': 'Selected',

        // Emergency Triage Entry
        'entry.heroTitle': 'Emergency Triage Assessment',
        'entry.heroDesc': 'Fast, secure, and accurate dental emergency assessment',
        'entry.ctaStart': 'Start Emergency Assessment',
        'entry.steps.assessSymptoms.title': 'Assess Symptoms',
        'entry.steps.assessSymptoms.desc': 'Answer questions about your pain and symptoms',
        'entry.steps.getUrgency.title': 'Get Urgency Level',
        'entry.steps.getUrgency.desc': 'Receive your urgency rating (1-5 scale)',
        'entry.steps.viewSlots.title': 'View Available Slots',
        'entry.steps.viewSlots.desc': 'See prioritized appointment times',
        'entry.steps.bookInstantly.title': 'Book Instantly',
        'entry.steps.bookInstantly.desc': 'Confirm your appointment immediately',
        'entry.emergencyNotice.title': 'Life-Threatening Emergency?',
        'entry.emergencyNotice.desc': "If you're experiencing severe breathing difficulties, uncontrolled bleeding, or signs of serious infection, call emergency services (112) immediately.",
        'entry.gdpr.title': 'Privacy & Security',
        'entry.gdpr.desc': 'Your health information is protected under GDPR. Data is encrypted and only shared with your selected dentist for appointment purposes.',
        'entry.return': 'Return to Main App',
        'entry.stats.minutes': '2-3 Minutes',
        'entry.stats.quick': 'Quick Assessment',
        'entry.stats.gdpr': 'GDPR Compliant',
        'entry.stats.secure': 'Secure & Private',
        'entry.stats.directBooking': 'Direct Booking',
        'entry.stats.noChat': 'No Chat Required',

        // Common
        'common.cancel': 'Cancel',
        'common.next': 'Next',
        'common.back': 'Back',
        'common.loading': 'Loading...',
        'common.success': 'Success',

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
        past: "Past",
        book: "Book",
        dentalCleaningRecommended: "Dental cleaning recommended in 2 months",
        healthRecords: "Health Records",
        rewards: "Rewards",
        quicklyBookViewRecords: "Quickly book, view records, and manage payments.",
        yourTreatmentsWillAppear: "Your treatments and visits will appear here.",
        unpaid: "Unpaid",
        paid: "Paid",
        statements: "Statements",
        paidInvoices: "Your paid invoices will appear here.",
        downloadStatements: "Download monthly statements.",
        viewManageMedications: "View and manage your medications.",
        upload: "Upload",
        shareLink: "Share link",
        insuranceProvider: "Provider",
        insuranceProviderPlaceholder: "Mutuality / Insurance name",
        policyNumber: "Policy / Member ID",
        policyNumberPlaceholder: "Policy number",
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
        // Treatment records
        searchTreatments: "Search treatments...",
        filterByType: "Filter by type",
        allTypes: "All types",
        consultation: "Consultation",
        treatment: "Treatment",
        xray: "X-Ray",
        labResult: "Lab Result",
        dentist: "Dentist",
        treatmentType: "Treatment Type",
        date: "Date",
        noRecordsFound: "No treatment records found",
        appointmentRescheduled: "Appointment rescheduled",
        savedSuccessfully: "Saved successfully",

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
        intelligentDentalAssistant: "Assistant Dentaire Intelligent",
        experienceFuture: "Découvrez le futur",
        viewOurDentists: "Voir nos dentistes",
        aiDiagnosis: "Diagnostic IA",
        startConsultation: "Commencer la consultation",
        bookAppointment: "Prendre Rendez-vous",
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
        accessCaberu: "Accès à Caberu",
        signInOrCreate: "Connectez-vous ou créez un compte pour commencer",
        signInButton: "Se connecter",
        createAccountButton: "Créer un compte",
        accountCreatedSuccess: "Compte créé avec succès !",
        checkEmailConfirm: "Vérifiez votre email pour confirmer votre compte.",
        signUpError: "Erreur lors de l'inscription",
        signInError: "Erreur lors de la connexion",
        signInSuccess: "Connexion réussie !",
        welcomeToCaberu: "Bienvenue sur Caberu.",

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
            "Bonjour ! Je suis Caberu. Comment puis-je vous aider aujourd'hui ? 🦷",
        detailedWelcomeMessage: "Bienvenue sur First Smile AI ! 🦷✨\n\nJe suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :\n\n🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires\n📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée\n📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA\n👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille\n\n💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !\n\nComment puis-je vous aider aujourd'hui ?",
        detailedWelcomeMessageWithName: (
            name: string,
        ) => `Bienvenue sur First Smile AI ! 🦷✨\n\nBonjour ${name} ! Je suis votre assistant dentaire IA, disponible 24h/24 pour vous aider avec :\n\n🤖 **Chat IA** - Obtenez des réponses instantanées à vos questions dentaires\n📅 **Réservation Intelligente** - Réservez des rendez-vous intelligemment avec les informations de durée\n📸 **Analyse Photo** - Téléchargez des photos pour une analyse dentaire alimentée par l'IA\n👨‍👩‍👧‍👦 **Soins Familiaux** - Réservez des rendez-vous pour vous ou les membres de votre famille\n\n💡 **Astuce Pro** : Dites-moi simplement ce qui vous dérange, et je vous guiderai à travers tout !\n\nComment puis-je vous aider aujourd'hui ?`,

        // Landing page
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
        consentHealthData: "Je consens à ce que Caberu traite mes données personnelles et de santé pour la prise de rendez-vous et le support des services dentaires.",
        childConsentNote: "Si vous saisissez des données pour un patient de moins de 16 ans, vous confirmez être son parent ou tuteur légal et consentez au traitement de ses données.",
        downloadMyData: "Télécharger Mes Données",
        deleteAccount: "Supprimer Mon Compte et Mes Données",
        deleteAccountConfirm: "La suppression de votre compte effacera définitivement toutes vos données personnelles et de santé des systèmes de Caberu. Cette action est irréversible. Êtes-vous sûr ?",
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

        // Booking Triage
        'booking.title': 'Réserver Votre Rendez-vous',
        'booking.earliest': 'Créneaux Disponibles au Plus Tôt',
        'booking.confirm': 'Confirmer le Rendez-vous',
        'booking.success': 'Rendez-vous réservé avec succès!',
        'booking.detailsTitle': 'Détails du rendez-vous',
        'booking.dentist': 'Dentiste',
        'booking.date': 'Date',
        'booking.time': 'Heure',
        'booking.urgency': 'Urgence',
        'booking.urgentArrivalNotice': 'En raison du caractère urgent de votre cas, veuillez arriver 15 minutes en avance. Si votre état s’aggrave, contactez immédiatement les services d’urgence.',
        'booking.continue': 'Continuer vers le tableau de bord',
        'booking.selectDate': 'Sélectionner une date',
        'booking.availableTimes': 'Horaires disponibles',
        'booking.noSlots': 'Aucun créneau disponible pour cette date',
        'booking.selectDatePrompt': 'Veuillez sélectionner une date pour voir les horaires disponibles',
        'booking.selectedDentist': 'Dentiste sélectionné',
        'booking.selectedBadge': 'Sélectionné',

        // Emergency Triage Entry
        'entry.heroTitle': "Évaluation de Triage d'Urgence",
        'entry.heroDesc': 'Évaluation dentaire d’urgence rapide, sécurisée et précise',
        'entry.ctaStart': "Commencer l'évaluation d'urgence",
        'entry.steps.assessSymptoms.title': 'Évaluer les symptômes',
        'entry.steps.assessSymptoms.desc': 'Répondez aux questions sur votre douleur et vos symptômes',
        'entry.steps.getUrgency.title': "Obtenir le niveau d'urgence",
        'entry.steps.getUrgency.desc': 'Recevez votre niveau d’urgence (échelle 1-5)',
        'entry.steps.viewSlots.title': 'Voir les créneaux disponibles',
        'entry.steps.viewSlots.desc': 'Consultez les horaires de rendez-vous prioritaires',
        'entry.steps.bookInstantly.title': 'Réserver instantanément',
        'entry.steps.bookInstantly.desc': 'Confirmez votre rendez-vous immédiatement',
        'entry.emergencyNotice.title': 'Urgence vitale ?',
        'entry.emergencyNotice.desc': "Si vous avez de graves difficultés respiratoires, des saignements incontrôlables ou des signes d’infection grave, appelez immédiatement les services d’urgence (112).",
        'entry.gdpr.title': 'Confidentialité & Sécurité',
        'entry.gdpr.desc': 'Vos informations de santé sont protégées selon le RGPD. Les données sont chiffrées et uniquement partagées avec le dentiste sélectionné pour la prise de rendez-vous.',
        'entry.return': "Retour à l'application principale",
        'entry.stats.minutes': '2-3 minutes',
        'entry.stats.quick': 'Évaluation rapide',
        'entry.stats.gdpr': 'Conforme RGPD',
        'entry.stats.secure': 'Sécurisé & Privé',
        'entry.stats.directBooking': 'Réservation directe',
        'entry.stats.noChat': 'Sans chat requis',

        // Common
        'common.cancel': 'Annuler',
        'common.next': 'Suivant',
        'common.back': 'Retour',
        'common.loading': 'Chargement...',
        'common.success': 'Succès',

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
        past: "Passé",
        book: "Réserver",
        dentalCleaningRecommended: "Nettoyage dentaire recommandé dans 2 mois",
        healthRecords: "Dossiers de Santé",
        rewards: "Récompenses",
        quicklyBookViewRecords: "Réservez rapidement, consultez les dossiers et gérez les paiements.",
        yourTreatmentsWillAppear: "Vos traitements et visites apparaîtront ici.",
        unpaid: "Impayé",
        paid: "Payé",
        statements: "Relevés",
        paidInvoices: "Vos factures payées apparaîtront ici.",
        downloadStatements: "Téléchargez les relevés mensuels.",
        viewManageMedications: "Consultez et gérez vos médicaments.",
        upload: "Téléverser",
        shareLink: "Partager le lien",
        insuranceProvider: "Fournisseur",
        insuranceProviderPlaceholder: "Mutualité / Nom de l'assurance",
        policyNumber: "Numéro de Police / ID Membre",
        policyNumberPlaceholder: "Numéro de police",
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

        // Treatment records
        searchTreatments: "Rechercher des traitements...",
        filterByType: "Filtrer par type",
        allTypes: "Tous les types",
        consultation: "Consultation",
        treatment: "Traitement",
        xray: "Radiographie",
        labResult: "Résultat de Laboratoire",
        dentist: "Dentiste",
        treatmentType: "Type de Traitement",
        date: "Date",
        noRecordsFound: "Aucun dossier de traitement trouvé",
        appointmentRescheduled: "Rendez-vous reporté",
        savedSuccessfully: "Enregistré avec succès",

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
    nl: {}
};
