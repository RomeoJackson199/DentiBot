import { LanguageConfig } from '@/types/common';

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    direction: 'ltr'
  },
  nl: {
    code: 'nl',
    name: 'Nederlands',
    flag: '🇳🇱',
    direction: 'ltr'
  }
};

export const DEFAULT_LANGUAGE = 'en';

export const TRANSLATIONS = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    patients: 'Patients',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    optional: 'Optional',
    
    // Appointment related
    bookAppointment: 'Book Appointment',
    appointmentDate: 'Appointment Date',
    appointmentTime: 'Appointment Time',
    appointmentType: 'Appointment Type',
    appointmentStatus: 'Appointment Status',
    appointmentNotes: 'Appointment Notes',
    appointmentConfirmed: 'Appointment Confirmed!',
    emergencyBooking: 'Emergency Booking',
    urgentCare: 'Urgent Care',
    selectDentist: 'Select Dentist',
    chooseDentist: 'Choose a dentist',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    selectAppointmentType: 'Select appointment type',
    confirmBooking: 'Confirm Booking',
    booking: 'Booking...',
    bookAppointmentDescription: 'Book your dental consultation in a few clicks',
    additionalNotes: 'Additional Notes (optional)',
    describeSymptoms: 'Describe your symptoms or concerns...',
    noSlotsAvailable: 'No slots available for this date',
    unableToLoadSlots: 'Unable to load available slots',
    unableToBookAppointment: 'Unable to book appointment',
    missingInformation: 'Missing Information',
    pleaseCompleteAllFields: 'Please complete all required fields',
    incompleteProfile: 'Incomplete Profile',
    pleaseCompleteProfileFirst: 'Please complete your profile in settings before booking an appointment',
    generalConsultation: 'General Consultation',
    cleaning: 'Cleaning',
    checkup: 'Checkup',
    emergency: 'Emergency',
    followUp: 'Follow-up',
    
    // Patient related
    patientName: 'Patient Name',
    patientEmail: 'Patient Email',
    patientPhone: 'Patient Phone',
    patientHistory: 'Patient History',
    medicalRecords: 'Medical Records',
    treatmentPlans: 'Treatment Plans',
    prescriptions: 'Prescriptions',
    
    // Schedule Management
    weeklyAvailability: 'Weekly Availability',
    workingHours: 'Working Hours',
    breakTime: 'Break Time',
    saveAvailability: 'Save Availability',
    availabilityUpdated: 'Availability updated successfully',
    failedToLoadAvailability: 'Failed to load availability',
    failedToSaveAvailability: 'Failed to save availability',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    
    // AI and Chat
    aiAssistant: 'AI Assistant',
    chatWithAI: 'Chat with AI',
    aiSuggestions: 'AI Suggestions',
    aiWriting: 'AI Writing Assistant',
    triageAssessment: 'Triage Assessment',
    
    // Status messages
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    
    // Form labels
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    dateOfBirth: 'Date of Birth',
    address: 'Address',
    reason: 'Reason',
    symptoms: 'Symptoms',
    urgency: 'Urgency Level',
    
    // Time and dates
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    nextMonth: 'Next Month',
    
    // Urgency levels
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    
    // Appointment status
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    
    // Messages
    noDataAvailable: 'No data available',
    noResultsFound: 'No results found',
    somethingWentWrong: 'Something went wrong',
    tryAgainLater: 'Please try again later',
    connectionError: 'Connection error',
    sessionExpired: 'Session expired',
    
    // Success messages
    appointmentBooked: 'Appointment booked successfully',
    appointmentUpdated: 'Appointment updated successfully',
    appointmentCancelled: 'Appointment cancelled successfully',
    patientAdded: 'Patient added successfully',
    patientUpdated: 'Patient updated successfully',
    settingsSaved: 'Settings saved successfully',
    
    // Error messages
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidDate: 'Please enter a valid date',
    appointmentConflict: 'This time slot is not available',
    networkError: 'Network error. Please check your connection',
    
    // AI Messages
    aiThinking: 'AI is thinking...',
    aiProcessing: 'Processing your request...',
    aiSuggestion: 'AI Suggestion',
    aiApproved: 'AI suggestion approved',
    aiRejected: 'AI suggestion rejected',
    
    // Accessibility
    closeDialog: 'Close dialog',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    expandSection: 'Expand section',
    collapseSection: 'Collapse section',
    
    // PWA
    installApp: 'Install App',
    appInstalled: 'App installed successfully',
    appUpdateAvailable: 'App update available',
    offlineMode: 'Offline mode',
    syncData: 'Sync data',
    
    // Patient navigation context
    pnav: {
      home: { label: 'Home', title: 'Home' },
      care: {
        label: 'Care',
        title: 'Care',
        health: 'Health',
        appointments: 'Appointments',
        prescriptions: 'Prescriptions',
        documents: 'Documents'
      },
      billing: {
        label: 'Billing',
        title: 'Billing'
      },
      account: {
        label: 'Account',
        title: 'Account',
        profile: 'Profile',
        insurance: 'Insurance',
        privacy: 'Privacy',
        help: 'Help'
      }
    }
  },
  
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    appointments: 'Rendez-vous',
    patients: 'Patients',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    
    // Common actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    clear: 'Effacer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    optional: 'Optionnel',
    
    // Appointment related
    bookAppointment: 'Prendre Rendez-vous',
    appointmentDate: 'Date du Rendez-vous',
    appointmentTime: 'Heure du Rendez-vous',
    appointmentType: 'Type de Rendez-vous',
    appointmentStatus: 'Statut du Rendez-vous',
    appointmentNotes: 'Notes du Rendez-vous',
    appointmentConfirmed: 'Rendez-vous Confirmé!',
    emergencyBooking: 'Réservation d\'Urgence',
    urgentCare: 'Soins d\'Urgence',
    selectDentist: 'Sélectionner un Dentiste',
    chooseDentist: 'Choisir un dentiste',
    selectDate: 'Sélectionner une Date',
    selectTime: 'Sélectionner une Heure',
    selectAppointmentType: 'Sélectionner le type de rendez-vous',
    confirmBooking: 'Confirmer la Réservation',
    booking: 'Réservation en cours...',
    bookAppointmentDescription: 'Réservez votre consultation dentaire en quelques clics',
    additionalNotes: 'Notes Supplémentaires (optionnel)',
    describeSymptoms: 'Décrivez vos symptômes ou préoccupations...',
    noSlotsAvailable: 'Aucun créneau disponible pour cette date',
    unableToLoadSlots: 'Impossible de charger les créneaux disponibles',
    unableToBookAppointment: 'Impossible de réserver le rendez-vous',
    missingInformation: 'Informations Manquantes',
    pleaseCompleteAllFields: 'Veuillez remplir tous les champs obligatoires',
    incompleteProfile: 'Profil Incomplet',
    pleaseCompleteProfileFirst: 'Veuillez compléter votre profil dans les paramètres avant de prendre rendez-vous',
    generalConsultation: 'Consultation Générale',
    cleaning: 'Nettoyage',
    checkup: 'Contrôle',
    emergency: 'Urgence',
    followUp: 'Suivi',
    
    // Patient related
    patientName: 'Nom du Patient',
    patientEmail: 'Email du Patient',
    patientPhone: 'Téléphone du Patient',
    patientHistory: 'Historique du Patient',
    medicalRecords: 'Dossiers Médicaux',
    treatmentPlans: 'Plans de Traitement',
    prescriptions: 'Ordonnances',
    
    // Schedule Management
    weeklyAvailability: 'Disponibilité Hebdomadaire',
    workingHours: 'Heures de Travail',
    breakTime: 'Pause',
    saveAvailability: 'Enregistrer la Disponibilité',
    availabilityUpdated: 'Disponibilité mise à jour avec succès',
    failedToLoadAvailability: 'Échec du chargement de la disponibilité',
    failedToSaveAvailability: 'Échec de l\'enregistrement de la disponibilité',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
    
    // AI and Chat
    aiAssistant: 'Assistant IA',
    chatWithAI: 'Discuter avec l\'IA',
    aiSuggestions: 'Suggestions IA',
    aiWriting: 'Assistant d\'Écriture IA',
    triageAssessment: 'Évaluation de Triage',
    
    // Status messages
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Information',
    
    // Form labels
    firstName: 'Prénom',
    lastName: 'Nom de Famille',
    email: 'Email',
    phone: 'Téléphone',
    dateOfBirth: 'Date de Naissance',
    address: 'Adresse',
    reason: 'Raison',
    symptoms: 'Symptômes',
    urgency: 'Niveau d\'Urgence',
    
    // Time and dates
    today: 'Aujourd\'hui',
    tomorrow: 'Demain',
    thisWeek: 'Cette Semaine',
    nextWeek: 'Semaine Prochaine',
    thisMonth: 'Ce Mois',
    nextMonth: 'Mois Prochain',
    
    // Urgency levels
    low: 'Faible',
    normal: 'Normal',
    high: 'Élevé',
    urgent: 'Urgent',
    
    // Appointment status
    scheduled: 'Programmé',
    confirmed: 'Confirmé',
    inProgress: 'En Cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    noShow: 'Absent',
    
    // Messages
    noDataAvailable: 'Aucune donnée disponible',
    noResultsFound: 'Aucun résultat trouvé',
    somethingWentWrong: 'Quelque chose s\'est mal passé',
    tryAgainLater: 'Veuillez réessayer plus tard',
    connectionError: 'Erreur de connexion',
    sessionExpired: 'Session expirée',
    
    // Success messages
    appointmentBooked: 'Rendez-vous réservé avec succès',
    appointmentUpdated: 'Rendez-vous mis à jour avec succès',
    appointmentCancelled: 'Rendez-vous annulé avec succès',
    patientAdded: 'Patient ajouté avec succès',
    patientUpdated: 'Patient mis à jour avec succès',
    settingsSaved: 'Paramètres enregistrés avec succès',
    
    // Error messages
    requiredField: 'Ce champ est obligatoire',
    invalidEmail: 'Veuillez entrer un email valide',
    invalidPhone: 'Veuillez entrer un numéro de téléphone valide',
    invalidDate: 'Veuillez entrer une date valide',
    appointmentConflict: 'Ce créneau n\'est pas disponible',
    networkError: 'Erreur de réseau. Veuillez vérifier votre connexion',
    
    // AI Messages
    aiThinking: 'L\'IA réfléchit...',
    aiProcessing: 'Traitement de votre demande...',
    aiSuggestion: 'Suggestion IA',
    aiApproved: 'Suggestion IA approuvée',
    aiRejected: 'Suggestion IA rejetée',
    
    // Accessibility
    closeDialog: 'Fermer le dialogue',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    expandSection: 'Développer la section',
    collapseSection: 'Réduire la section',
    
    // PWA
    installApp: 'Installer l\'Application',
    appInstalled: 'Application installée avec succès',
    appUpdateAvailable: 'Mise à jour disponible',
    offlineMode: 'Mode hors ligne',
    syncData: 'Synchroniser les données',
    
    // Patient navigation context
    pnav: {
      home: { label: 'Accueil', title: 'Accueil' },
      care: {
        label: 'Soins',
        title: 'Soins',
        health: 'Santé',
        appointments: 'Rendez-vous',
        prescriptions: 'Ordonnances',
        documents: 'Documents'
      },
      billing: {
        label: 'Facturation',
        title: 'Facturation'
      },
      account: {
        label: 'Compte',
        title: 'Compte',
        profile: 'Profil',
        insurance: 'Assurance',
        privacy: 'Confidentialité',
        help: 'Aide'
      }
    }
  },
  
  nl: {
    // Navigation
    dashboard: 'Dashboard',
    appointments: 'Afspraken',
    patients: 'Patiënten',
    settings: 'Instellingen',
    profile: 'Profiel',
    logout: 'Uitloggen',
    
    // Common actions
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    view: 'Bekijken',
    add: 'Toevoegen',
    search: 'Zoeken',
    filter: 'Filteren',
    clear: 'Wissen',
    confirm: 'Bevestigen',
    back: 'Terug',
    next: 'Volgende',
    previous: 'Vorige',
    optional: 'Optioneel',
    
    // Appointment related
    bookAppointment: 'Afspraak Maken',
    appointmentDate: 'Afspraakdatum',
    appointmentTime: 'Afspraaktijd',
    appointmentType: 'Type Afspraak',
    appointmentStatus: 'Afspraak Status',
    appointmentNotes: 'Afspraak Notities',
    appointmentConfirmed: 'Afspraak Bevestigd!',
    emergencyBooking: 'Spoedboeking',
    urgentCare: 'Spoedzorg',
    selectDentist: 'Selecteer Tandarts',
    chooseDentist: 'Kies een tandarts',
    selectDate: 'Selecteer Datum',
    selectTime: 'Selecteer Tijd',
    selectAppointmentType: 'Selecteer type afspraak',
    confirmBooking: 'Boeking Bevestigen',
    booking: 'Boeken...',
    bookAppointmentDescription: 'Boek uw tandheelkundige consultatie in een paar klikken',
    additionalNotes: 'Extra Notities (optioneel)',
    describeSymptoms: 'Beschrijf uw symptomen of zorgen...',
    noSlotsAvailable: 'Geen tijdsloten beschikbaar voor deze datum',
    unableToLoadSlots: 'Kan beschikbare tijdsloten niet laden',
    unableToBookAppointment: 'Kan afspraak niet boeken',
    missingInformation: 'Ontbrekende Informatie',
    pleaseCompleteAllFields: 'Vul alle verplichte velden in',
    incompleteProfile: 'Onvolledig Profiel',
    pleaseCompleteProfileFirst: 'Voltooi eerst uw profiel in de instellingen voordat u een afspraak maakt',
    generalConsultation: 'Algemene Consultatie',
    cleaning: 'Reiniging',
    checkup: 'Controle',
    emergency: 'Noodgeval',
    followUp: 'Vervolgafspraak',
    
    // Patient related
    patientName: 'Patiëntnaam',
    patientEmail: 'Patiënt E-mail',
    patientPhone: 'Patiënt Telefoon',
    patientHistory: 'Patiëntgeschiedenis',
    medicalRecords: 'Medische Dossiers',
    treatmentPlans: 'Behandelingsplannen',
    prescriptions: 'Recepten',
    
    // Schedule Management
    weeklyAvailability: 'Wekelijkse Beschikbaarheid',
    workingHours: 'Werktijden',
    breakTime: 'Pauze',
    saveAvailability: 'Beschikbaarheid Opslaan',
    availabilityUpdated: 'Beschikbaarheid succesvol bijgewerkt',
    failedToLoadAvailability: 'Kan beschikbaarheid niet laden',
    failedToSaveAvailability: 'Kan beschikbaarheid niet opslaan',
    monday: 'Maandag',
    tuesday: 'Dinsdag',
    wednesday: 'Woensdag',
    thursday: 'Donderdag',
    friday: 'Vrijdag',
    saturday: 'Zaterdag',
    sunday: 'Zondag',
    
    // AI and Chat
    aiAssistant: 'AI Assistent',
    chatWithAI: 'Chat met AI',
    aiSuggestions: 'AI Suggesties',
    aiWriting: 'AI Schrijfassistent',
    triageAssessment: 'Triage Beoordeling',
    
    // Status messages
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    warning: 'Waarschuwing',
    info: 'Informatie',
    
    // Form labels
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    email: 'E-mail',
    phone: 'Telefoon',
    dateOfBirth: 'Geboortedatum',
    address: 'Adres',
    reason: 'Reden',
    symptoms: 'Symptomen',
    urgency: 'Urgentieniveau',
    
    // Time and dates
    today: 'Vandaag',
    tomorrow: 'Morgen',
    thisWeek: 'Deze Week',
    nextWeek: 'Volgende Week',
    thisMonth: 'Deze Maand',
    nextMonth: 'Volgende Maand',
    
    // Urgency levels
    low: 'Laag',
    normal: 'Normaal',
    high: 'Hoog',
    urgent: 'Dringend',
    
    // Appointment status
    scheduled: 'Gepland',
    confirmed: 'Bevestigd',
    inProgress: 'In Behandeling',
    completed: 'Voltooid',
    cancelled: 'Geannuleerd',
    noShow: 'Niet Verschenen',
    
    // Messages
    noDataAvailable: 'Geen gegevens beschikbaar',
    noResultsFound: 'Geen resultaten gevonden',
    somethingWentWrong: 'Er is iets misgegaan',
    tryAgainLater: 'Probeer het later opnieuw',
    connectionError: 'Verbindingsfout',
    sessionExpired: 'Sessie verlopen',
    
    // Success messages
    appointmentBooked: 'Afspraak succesvol geboekt',
    appointmentUpdated: 'Afspraak succesvol bijgewerkt',
    appointmentCancelled: 'Afspraak succesvol geannuleerd',
    patientAdded: 'Patiënt succesvol toegevoegd',
    patientUpdated: 'Patiënt succesvol bijgewerkt',
    settingsSaved: 'Instellingen succesvol opgeslagen',
    
    // Error messages
    requiredField: 'Dit veld is verplicht',
    invalidEmail: 'Voer een geldig e-mailadres in',
    invalidPhone: 'Voer een geldig telefoonnummer in',
    invalidDate: 'Voer een geldige datum in',
    appointmentConflict: 'Dit tijdslot is niet beschikbaar',
    networkError: 'Netwerkfout. Controleer uw verbinding',
    
    // AI Messages
    aiThinking: 'AI denkt na...',
    aiProcessing: 'Uw verzoek wordt verwerkt...',
    aiSuggestion: 'AI Suggestie',
    aiApproved: 'AI suggestie goedgekeurd',
    aiRejected: 'AI suggestie afgewezen',
    
    // Accessibility
    closeDialog: 'Dialoogvenster sluiten',
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',
    expandSection: 'Sectie uitvouwen',
    collapseSection: 'Sectie invouwen',
    
    // PWA
    installApp: 'App Installeren',
    appInstalled: 'App succesvol geïnstalleerd',
    appUpdateAvailable: 'App-update beschikbaar',
    offlineMode: 'Offline modus',
    syncData: 'Gegevens synchroniseren',
    
    // Patient navigation context
    pnav: {
      home: { label: 'Home', title: 'Home' },
      care: {
        label: 'Zorg',
        title: 'Zorg',
        health: 'Gezondheid',
        appointments: 'Afspraken',
        prescriptions: 'Recepten',
        documents: 'Documenten'
      },
      billing: {
        label: 'Facturering',
        title: 'Facturering'
      },
      account: {
        label: 'Account',
        title: 'Account',
        profile: 'Profiel',
        insurance: 'Verzekering',
        privacy: 'Privacy',
        help: 'Hulp'
      }
    }
  }
};

export function getTranslation(key: string, language: string = DEFAULT_LANGUAGE): string {
  const lang = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  return (lang as any)[key] || key;
}

export function getSupportedLanguages(): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES);
}

export function isValidLanguage(language: string): boolean {
  return language in SUPPORTED_LANGUAGES;
}
