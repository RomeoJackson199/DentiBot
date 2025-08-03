import { LanguageConfig } from '@/types/common';

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    direction: 'ltr'
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    direction: 'ltr'
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
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
    
    // Appointment related
    bookAppointment: 'Book Appointment',
    appointmentDate: 'Appointment Date',
    appointmentTime: 'Appointment Time',
    appointmentType: 'Appointment Type',
    appointmentStatus: 'Appointment Status',
    appointmentNotes: 'Appointment Notes',
    emergencyBooking: 'Emergency Booking',
    urgentCare: 'Urgent Care',
    
    // Patient related
    patientName: 'Patient Name',
    patientEmail: 'Patient Email',
    patientPhone: 'Patient Phone',
    patientHistory: 'Patient History',
    medicalRecords: 'Medical Records',
    treatmentPlans: 'Treatment Plans',
    prescriptions: 'Prescriptions',
    
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
    syncData: 'Sync data'
  },
  
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    appointments: 'Citas',
    patients: 'Pacientes',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    
    // Common actions
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    add: 'Agregar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    
    // Appointment related
    bookAppointment: 'Reservar Cita',
    appointmentDate: 'Fecha de Cita',
    appointmentTime: 'Hora de Cita',
    appointmentType: 'Tipo de Cita',
    appointmentStatus: 'Estado de Cita',
    appointmentNotes: 'Notas de Cita',
    emergencyBooking: 'Reserva de Emergencia',
    urgentCare: 'Atención Urgente',
    
    // Patient related
    patientName: 'Nombre del Paciente',
    patientEmail: 'Email del Paciente',
    patientPhone: 'Teléfono del Paciente',
    patientHistory: 'Historial del Paciente',
    medicalRecords: 'Expedientes Médicos',
    treatmentPlans: 'Planes de Tratamiento',
    prescriptions: 'Recetas',
    
    // AI and Chat
    aiAssistant: 'Asistente IA',
    chatWithAI: 'Chatear con IA',
    aiSuggestions: 'Sugerencias de IA',
    aiWriting: 'Asistente de Escritura IA',
    triageAssessment: 'Evaluación de Triaje',
    
    // Status messages
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    
    // Form labels
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    dateOfBirth: 'Fecha de Nacimiento',
    address: 'Dirección',
    reason: 'Motivo',
    symptoms: 'Síntomas',
    urgency: 'Nivel de Urgencia',
    
    // Time and dates
    today: 'Hoy',
    tomorrow: 'Mañana',
    thisWeek: 'Esta Semana',
    nextWeek: 'Próxima Semana',
    thisMonth: 'Este Mes',
    nextMonth: 'Próximo Mes',
    
    // Urgency levels
    low: 'Bajo',
    normal: 'Normal',
    high: 'Alto',
    urgent: 'Urgente',
    
    // Appointment status
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    inProgress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    noShow: 'No Presentó',
    
    // Messages
    noDataAvailable: 'No hay datos disponibles',
    noResultsFound: 'No se encontraron resultados',
    somethingWentWrong: 'Algo salió mal',
    tryAgainLater: 'Por favor intente más tarde',
    connectionError: 'Error de conexión',
    sessionExpired: 'Sesión expirada',
    
    // Success messages
    appointmentBooked: 'Cita reservada exitosamente',
    appointmentUpdated: 'Cita actualizada exitosamente',
    appointmentCancelled: 'Cita cancelada exitosamente',
    patientAdded: 'Paciente agregado exitosamente',
    patientUpdated: 'Paciente actualizado exitosamente',
    settingsSaved: 'Configuración guardada exitosamente',
    
    // Error messages
    requiredField: 'Este campo es obligatorio',
    invalidEmail: 'Por favor ingrese un email válido',
    invalidPhone: 'Por favor ingrese un teléfono válido',
    invalidDate: 'Por favor ingrese una fecha válida',
    appointmentConflict: 'Este horario no está disponible',
    networkError: 'Error de red. Por favor verifique su conexión',
    
    // AI Messages
    aiThinking: 'IA está pensando...',
    aiProcessing: 'Procesando su solicitud...',
    aiSuggestion: 'Sugerencia de IA',
    aiApproved: 'Sugerencia de IA aprobada',
    aiRejected: 'Sugerencia de IA rechazada',
    
    // Accessibility
    closeDialog: 'Cerrar diálogo',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    expandSection: 'Expandir sección',
    collapseSection: 'Colapsar sección',
    
    // PWA
    installApp: 'Instalar App',
    appInstalled: 'App instalada exitosamente',
    appUpdateAvailable: 'Actualización de app disponible',
    offlineMode: 'Modo sin conexión',
    syncData: 'Sincronizar datos'
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
    
    // Appointment related
    bookAppointment: 'Prendre Rendez-vous',
    appointmentDate: 'Date du Rendez-vous',
    appointmentTime: 'Heure du Rendez-vous',
    appointmentType: 'Type de Rendez-vous',
    appointmentStatus: 'Statut du Rendez-vous',
    appointmentNotes: 'Notes du Rendez-vous',
    emergencyBooking: 'Réservation d\'Urgence',
    urgentCare: 'Soins d\'Urgence',
    
    // Patient related
    patientName: 'Nom du Patient',
    patientEmail: 'Email du Patient',
    patientPhone: 'Téléphone du Patient',
    patientHistory: 'Historique du Patient',
    medicalRecords: 'Dossiers Médicaux',
    treatmentPlans: 'Plans de Traitement',
    prescriptions: 'Ordonnances',
    
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
    networkError: 'Erreur réseau. Veuillez vérifier votre connexion',
    
    // AI Messages
    aiThinking: 'IA réfléchit...',
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
    installApp: 'Installer l\'App',
    appInstalled: 'App installée avec succès',
    appUpdateAvailable: 'Mise à jour de l\'app disponible',
    offlineMode: 'Mode hors ligne',
    syncData: 'Synchroniser les données'
  },
  
  de: {
    // Navigation
    dashboard: 'Dashboard',
    appointments: 'Termine',
    patients: 'Patienten',
    settings: 'Einstellungen',
    profile: 'Profil',
    logout: 'Abmelden',
    
    // Common actions
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    view: 'Anzeigen',
    add: 'Hinzufügen',
    search: 'Suchen',
    filter: 'Filtern',
    clear: 'Löschen',
    confirm: 'Bestätigen',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Zurück',
    
    // Appointment related
    bookAppointment: 'Termin Buchen',
    appointmentDate: 'Termindatum',
    appointmentTime: 'Terminzeit',
    appointmentType: 'Termintyp',
    appointmentStatus: 'Terminstatus',
    appointmentNotes: 'Terminnotizen',
    emergencyBooking: 'Notfalltermin',
    urgentCare: 'Notfallversorgung',
    
    // Patient related
    patientName: 'Patientenname',
    patientEmail: 'Patienten-E-Mail',
    patientPhone: 'Patiententelefon',
    patientHistory: 'Patientenhistorie',
    medicalRecords: 'Medizinische Unterlagen',
    treatmentPlans: 'Behandlungspläne',
    prescriptions: 'Rezepte',
    
    // AI and Chat
    aiAssistant: 'KI-Assistent',
    chatWithAI: 'Mit KI chatten',
    aiSuggestions: 'KI-Vorschläge',
    aiWriting: 'KI-Schreibassistent',
    triageAssessment: 'Triage-Bewertung',
    
    // Status messages
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    info: 'Information',
    
    // Form labels
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    phone: 'Telefon',
    dateOfBirth: 'Geburtsdatum',
    address: 'Adresse',
    reason: 'Grund',
    symptoms: 'Symptome',
    urgency: 'Dringlichkeitsstufe',
    
    // Time and dates
    today: 'Heute',
    tomorrow: 'Morgen',
    thisWeek: 'Diese Woche',
    nextWeek: 'Nächste Woche',
    thisMonth: 'Dieser Monat',
    nextMonth: 'Nächster Monat',
    
    // Urgency levels
    low: 'Niedrig',
    normal: 'Normal',
    high: 'Hoch',
    urgent: 'Dringend',
    
    // Appointment status
    scheduled: 'Geplant',
    confirmed: 'Bestätigt',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    noShow: 'Nicht erschienen',
    
    // Messages
    noDataAvailable: 'Keine Daten verfügbar',
    noResultsFound: 'Keine Ergebnisse gefunden',
    somethingWentWrong: 'Etwas ist schiefgelaufen',
    tryAgainLater: 'Bitte versuchen Sie es später erneut',
    connectionError: 'Verbindungsfehler',
    sessionExpired: 'Sitzung abgelaufen',
    
    // Success messages
    appointmentBooked: 'Termin erfolgreich gebucht',
    appointmentUpdated: 'Termin erfolgreich aktualisiert',
    appointmentCancelled: 'Termin erfolgreich storniert',
    patientAdded: 'Patient erfolgreich hinzugefügt',
    patientUpdated: 'Patient erfolgreich aktualisiert',
    settingsSaved: 'Einstellungen erfolgreich gespeichert',
    
    // Error messages
    requiredField: 'Dieses Feld ist erforderlich',
    invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    invalidPhone: 'Bitte geben Sie eine gültige Telefonnummer ein',
    invalidDate: 'Bitte geben Sie ein gültiges Datum ein',
    appointmentConflict: 'Dieser Zeitraum ist nicht verfügbar',
    networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung',
    
    // AI Messages
    aiThinking: 'KI denkt nach...',
    aiProcessing: 'Verarbeitung Ihrer Anfrage...',
    aiSuggestion: 'KI-Vorschlag',
    aiApproved: 'KI-Vorschlag genehmigt',
    aiRejected: 'KI-Vorschlag abgelehnt',
    
    // Accessibility
    closeDialog: 'Dialog schließen',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    expandSection: 'Abschnitt erweitern',
    collapseSection: 'Abschnitt reduzieren',
    
    // PWA
    installApp: 'App installieren',
    appInstalled: 'App erfolgreich installiert',
    appUpdateAvailable: 'App-Update verfügbar',
    offlineMode: 'Offline-Modus',
    syncData: 'Daten synchronisieren'
  }
};

export function getTranslation(key: string, language: string = DEFAULT_LANGUAGE): string {
  const translations = TRANSLATIONS[language as keyof typeof TRANSLATIONS];
  if (!translations) {
    return TRANSLATIONS[DEFAULT_LANGUAGE][key as keyof typeof TRANSLATIONS[typeof DEFAULT_LANGUAGE]] || key;
  }
  return translations[key as keyof typeof translations] || key;
}

export function getSupportedLanguages(): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES);
}

export function isValidLanguage(language: string): boolean {
  return language in SUPPORTED_LANGUAGES;
}