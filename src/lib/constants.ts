// Shared constants for the application

// Supply SKU display names used to map to inventory item names
export const SKU_DISPLAY_NAME: Record<string, string> = {
  gloves: 'Gloves',
  mask: 'Mask',
  prophy_paste: 'Prophy Paste',
  disposable_cup: 'Disposable cup',
  anesthesia_cartridge: 'Anesthesia Cartridge',
  composite: 'Composite Syringe',
  bonding_agent: 'Bonding Agent',
  gauze: 'Gauze Pad',
  scalpel: 'Scalpel',
  sutures: 'Sutures',
  files: 'Files',
  sealer: 'Sealer',
  bur: 'Bur',
  impression_material: 'Impression Material',
  implant_kit: 'Implant Kit',
  drill: 'Drill',
  xray_film: 'X-ray film',
  scaler_tip: 'Scaler tip',
  fluoride_gel: 'Fluoride gel',
  tray: 'Tray',
  cotton_pellets: 'Cotton Pellets',
  matrix_bands: 'Matrix Bands',
  wedges: 'Wedges',
  polishing_strips: 'Polishing strips',
  separator: 'Separator',
  crown: 'Crown',
  retraction_cord: 'Retraction cord',
  temporary_cement: 'Temporary cement',
  final_cement: 'Final cement',
  bite_block: 'Bite block',
  needle: 'Needle',
  syringe: 'Syringe',
  healing_abutment: 'Healing abutment',
  cover_screw: 'Cover screw',
  bone_graft: 'Bone graft',
  membrane: 'Membrane',
  tacks: 'Tacks',
  developer: 'Developer',
  fixer: 'Fixer',
  irrigation: 'Irrigation',
  polishing_cup: 'Polishing cup',
  air_abrasion_powder: 'Air abrasion powder'
};

// Procedure definitions with default prices and supplies
export interface ProcedureDef {
  key: string;
  name: string;
  defaultPrice: number;
  defaultDurationMin: number;
  defaultSupplies: Array<{ sku: string; qty: number }>;
  category: 'Preventive' | 'Restorative' | 'Endo' | 'Surgery' | 'Radiology' | 'Perio' | 'Prostho' | 'Ortho' | 'Custom';
}

export const PROCEDURE_DEFS: ProcedureDef[] = [
  {
    key: 'checkup',
    name: 'Check-up',
    defaultPrice: 30,
    defaultDurationMin: 15,
    defaultSupplies: [{ sku: 'gloves', qty: 1 }, { sku: 'mask', qty: 1 }],
    category: 'Preventive'
  },
  {
    key: 'cleaning',
    name: 'Prophylaxis (Cleaning)',
    defaultPrice: 120,
    defaultDurationMin: 45,
    defaultSupplies: [
      { sku: 'prophy_paste', qty: 1 },
      { sku: 'disposable_cup', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 },
      { sku: 'scaler_tip', qty: 1 },
      { sku: 'fluoride_gel', qty: 1 },
      { sku: 'tray', qty: 1 }
    ],
    category: 'Preventive'
  },
  {
    key: 'filling_1',
    name: 'Filling — 1 surface',
    defaultPrice: 80,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'composite', qty: 1 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'filling_2',
    name: 'Filling — 2 surfaces',
    defaultPrice: 120,
    defaultDurationMin: 40,
    defaultSupplies: [
      { sku: 'composite', qty: 1 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'filling_3_plus',
    name: 'Filling — 3+ surfaces',
    defaultPrice: 150,
    defaultDurationMin: 50,
    defaultSupplies: [
      { sku: 'composite', qty: 2 },
      { sku: 'bonding_agent', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Restorative'
  },
  {
    key: 'root_canal_anterior',
    name: 'Root canal — anterior',
    defaultPrice: 200,
    defaultDurationMin: 60,
    defaultSupplies: [
      { sku: 'files', qty: 1 },
      { sku: 'sealer', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Endo'
  },
  {
    key: 'root_canal_molar',
    name: 'Root canal — molar',
    defaultPrice: 350,
    defaultDurationMin: 90,
    defaultSupplies: [
      { sku: 'files', qty: 2 },
      { sku: 'sealer', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 2 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Endo'
  },
  {
    key: 'extraction_simple',
    name: 'Extraction — simple',
    defaultPrice: 75,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'forceps', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'gauze', qty: 2 }
    ],
    category: 'Surgery'
  },
  {
    key: 'extraction_surgical',
    name: 'Extraction — surgical',
    defaultPrice: 150,
    defaultDurationMin: 60,
    defaultSupplies: [
      { sku: 'scalpel', qty: 1 },
      { sku: 'anesthesia_cartridge', qty: 2 },
      { sku: 'sutures', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'gauze', qty: 4 }
    ],
    category: 'Surgery'
  },
  {
    key: 'implant_placement',
    name: 'Implant — placement',
    defaultPrice: 1000,
    defaultDurationMin: 120,
    defaultSupplies: [
      { sku: 'implant_kit', qty: 1 },
      { sku: 'drill', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'sutures', qty: 1 },
      { sku: 'mask', qty: 1 },
      { sku: 'gauze', qty: 4 }
    ],
    category: 'Surgery'
  },
  {
    key: 'bitewing_xray',
    name: 'Bitewing — 2 images',
    defaultPrice: 25,
    defaultDurationMin: 10,
    defaultSupplies: [
      { sku: 'xray_film', qty: 2 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'periapical_xray',
    name: 'Periapical X-ray',
    defaultPrice: 20,
    defaultDurationMin: 8,
    defaultSupplies: [
      { sku: 'xray_film', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'panoramic_xray',
    name: 'Panoramic X-ray',
    defaultPrice: 60,
    defaultDurationMin: 15,
    defaultSupplies: [
      { sku: 'xray_film', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Radiology'
  },
  {
    key: 'scaling_quadrant',
    name: 'Scaling — per quadrant',
    defaultPrice: 90,
    defaultDurationMin: 45,
    defaultSupplies: [
      { sku: 'scaler_tip', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Perio'
  },
  {
    key: 'crown_prep',
    name: 'Crown prep',
    defaultPrice: 400,
    defaultDurationMin: 90,
    defaultSupplies: [
      { sku: 'bur', qty: 1 },
      { sku: 'impression_material', qty: 1 },
      { sku: 'gloves', qty: 1 },
      { sku: 'mask', qty: 1 }
    ],
    category: 'Prostho'
  },
  {
    key: 'temp_crown',
    name: 'Temporary crown',
    defaultPrice: 120,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'impression_material', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Prostho'
  },
  {
    key: 'ortho_adjustment',
    name: 'Ortho — adjustment',
    defaultPrice: 100,
    defaultDurationMin: 30,
    defaultSupplies: [
      { sku: 'pliers', qty: 1 },
      { sku: 'elastic', qty: 1 },
      { sku: 'gloves', qty: 1 }
    ],
    category: 'Ortho'
  }
];

// Status colors for consistent theming
export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
} as const;

// Urgency colors for consistent theming
export const URGENCY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
} as const;

// ============================================================================
// Application-wide Configuration Constants
// ============================================================================

// Cache Configuration
export const CACHE_CONFIG = {
  /** React Query stale time - 5 minutes */
  STALE_TIME: 5 * 60 * 1000,
  /** React Query garbage collection time - 10 minutes */
  GC_TIME: 10 * 60 * 1000,
  /** Maximum retry attempts for failed queries */
  MAX_RETRIES: 3,
  /** Base delay for retry (exponential backoff) */
  RETRY_BASE_DELAY: 1000,
  /** Maximum retry delay */
  MAX_RETRY_DELAY: 30000,
} as const;

// Error Reporting
export const ERROR_REPORTING = {
  /** Deduplication window for similar errors - 30 seconds */
  DEDUPE_WINDOW_MS: 30_000,
  /** Maximum stack trace length to store */
  MAX_STACK_TRACE_LENGTH: 5000,
} as const;

// UI Timings
export const UI_TIMINGS = {
  /** Delay before showing business picker dialog */
  BUSINESS_PICKER_DELAY: 500,
  /** Toast notification duration - default */
  TOAST_DURATION: 5000,
  /** Toast duration for critical errors */
  TOAST_CRITICAL_DURATION: 10000,
  /** Debounce delay for search inputs */
  SEARCH_DEBOUNCE: 300,
  /** Animation duration for transitions */
  ANIMATION_DURATION: 200,
} as const;

// Pagination
export const PAGINATION = {
  /** Default page size for lists */
  DEFAULT_PAGE_SIZE: 50,
  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
  /** Default notifications limit */
  NOTIFICATIONS_LIMIT: 50,
} as const;

// Notification Preferences (Defaults)
export const NOTIFICATION_DEFAULTS = {
  EMAIL_ENABLED: true,
  SMS_ENABLED: false,
  PUSH_ENABLED: true,
  IN_APP_ENABLED: true,
  APPOINTMENT_REMINDERS: true,
  PRESCRIPTION_UPDATES: true,
  TREATMENT_PLAN_UPDATES: true,
  EMERGENCY_ALERTS: true,
  SYSTEM_NOTIFICATIONS: true,
  QUIET_HOURS_START: '22:00',
  QUIET_HOURS_END: '07:00',
} as const;

// Business Templates
export const BUSINESS_TEMPLATES = {
  HEALTHCARE: 'healthcare',
  DENTIST: 'dentist',
  SALON: 'salon',
  RESTAURANT: 'restaurant',
} as const;

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  DENTIST: 'dentist',
  PROVIDER: 'provider',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  GUEST: 'guest',
} as const;

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// Appointment Urgency
export const APPOINTMENT_URGENCY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EMERGENCY: 'emergency',
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  /** Display format: Jan 1, 2024 */
  DISPLAY: 'MMM d, yyyy',
  /** Display with time: Jan 1, 2024 at 2:30 PM */
  DISPLAY_WITH_TIME: 'MMM d, yyyy \'at\' h:mm a',
  /** ISO format for APIs */
  ISO: 'yyyy-MM-dd',
  /** Time only: 2:30 PM */
  TIME: 'h:mm a',
  /** 24-hour time: 14:30 */
  TIME_24H: 'HH:mm',
} as const;

// API Configuration
export const API_CONFIG = {
  /** Timeout for API requests - 30 seconds */
  REQUEST_TIMEOUT: 30000,
  /** Maximum file upload size - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed image formats */
  ALLOWED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** Allowed document formats */
  ALLOWED_DOCUMENT_FORMATS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Validation Rules
export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 500,
  /** Maximum bio length */
  MAX_BIO_LENGTH: 1000,
  /** Phone number regex pattern */
  PHONE_PATTERN: /^\+?[\d\s\-\(\)]+$/,
  /** Email regex pattern */
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  SELECTED_BUSINESS: 'selected_business',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches',
  USER_PREFERENCES: 'user_preferences',
} as const;

// Feature Flags (for gradual rollout)
export const FEATURES = {
  ENABLE_AI_CHATBOT: true,
  ENABLE_VOICE_COMMANDS: false,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_RESTAURANT_MODE: true,
  ENABLE_SALON_MODE: true,
} as const;

// HTTP Status Codes (for clarity)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Type exports for type safety
export type BusinessTemplate = typeof BUSINESS_TEMPLATES[keyof typeof BUSINESS_TEMPLATES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
export type AppointmentUrgency = typeof APPOINTMENT_URGENCY[keyof typeof APPOINTMENT_URGENCY];