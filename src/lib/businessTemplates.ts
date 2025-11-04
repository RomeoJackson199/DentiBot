import { 
  Scissors, Stethoscope, UtensilsCrossed, Briefcase, Settings 
} from 'lucide-react';

export type TemplateType = 
  | 'dentist' 
  | 'hairdresser' 
  | 'restaurant'
  | 'generic'
  | 'custom';

export interface TemplateFeatures {
  prescriptions: boolean;
  treatmentPlans: boolean;
  medicalRecords: boolean;
  photoUpload: boolean;
  urgencyLevels: boolean;
  paymentRequests: boolean;
  aiChat: boolean;
  appointments: boolean;
  services: boolean;
}

export interface TemplateTerminology {
  customer: string;
  customerPlural: string;
  provider: string;
  providerPlural: string;
  appointment: string;
  appointmentPlural: string;
  service: string;
  servicePlural: string;
  business: string;
}

export interface QuickAddService {
  name: string;
  price: number;
  duration?: number;
  description?: string;
  category?: string;
}

export interface CompletionStep {
  id: string;
  title: string;
  enabled: boolean;
}

export interface AIBehaviorDefaults {
  systemBehavior: string;
  greeting: string;
  personalityTraits: string[];
}

export interface ServiceFieldLabels {
  serviceName: string;
  serviceNamePlaceholder: string;
  descriptionPlaceholder: string;
  categoryLabel: string;
  durationLabel: string;
}

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  description: string;
  icon: any;
  features: TemplateFeatures;
  terminology: TemplateTerminology;
  appointmentReasons: string[];
  defaultServices: string[];
  serviceCategories: string[];
  quickAddServices: QuickAddService[];
  serviceFieldLabels: ServiceFieldLabels;
  completionSteps: CompletionStep[];
  navigationItems: string[];
  aiBehaviorDefaults: AIBehaviorDefaults;
}

export const BUSINESS_TEMPLATES: Record<TemplateType, TemplateConfig> = {
  dentist: {
    id: 'dentist',
    name: 'Dental Clinic',
    description: 'Full-featured dental practice with prescriptions, treatment plans, and medical records',
    icon: Stethoscope,
    features: {
      prescriptions: true,
      treatmentPlans: true,
      medicalRecords: true,
      photoUpload: true,
      urgencyLevels: true,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    },
    terminology: {
      customer: 'Patient',
      customerPlural: 'Patients',
      provider: 'Dentist',
      providerPlural: 'Dentists',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Treatment',
      servicePlural: 'Treatments',
      business: 'Clinic',
    },
    appointmentReasons: [
      'Routine Checkup',
      'Cleaning',
      'Cavity Filling',
      'Root Canal',
      'Emergency',
      'Consultation',
    ],
    defaultServices: [
      'Teeth Cleaning',
      'Dental Exam',
      'Cavity Filling',
      'Root Canal',
      'Teeth Whitening',
    ],
    serviceCategories: [
      'General Dentistry',
      'Preventive Care',
      'Restorative',
      'Cosmetic',
      'Orthodontics',
      'Oral Surgery',
      'Emergency Care',
      'Pediatric Dentistry',
      'Periodontics',
      'Endodontics',
    ],
    quickAddServices: [
      { name: 'Routine Cleaning', price: 80, duration: 30, description: 'Professional teeth cleaning and polishing', category: 'Preventive Care' },
      { name: 'Dental Examination', price: 50, duration: 20, description: 'Comprehensive oral health check-up', category: 'General Dentistry' },
      { name: 'X-Ray', price: 35, duration: 15, description: 'Digital dental radiography', category: 'General Dentistry' },
      { name: 'Filling', price: 120, duration: 45, description: 'Composite or amalgam cavity filling', category: 'Restorative' },
      { name: 'Tooth Extraction', price: 150, duration: 30, description: 'Simple tooth extraction procedure', category: 'Oral Surgery' },
      { name: 'Root Canal', price: 400, duration: 90, description: 'Endodontic root canal treatment', category: 'Endodontics' },
      { name: 'Teeth Whitening', price: 250, duration: 60, description: 'Professional teeth bleaching treatment', category: 'Cosmetic' },
      { name: 'Dental Crown', price: 800, duration: 60, description: 'Porcelain or ceramic crown placement', category: 'Restorative' },
      { name: 'Dental Implant', price: 2000, duration: 120, description: 'Surgical implant placement', category: 'Oral Surgery' },
      { name: 'Braces Consultation', price: 100, duration: 45, description: 'Orthodontic assessment and treatment planning', category: 'Orthodontics' },
    ],
    serviceFieldLabels: {
      serviceName: 'Treatment Name',
      serviceNamePlaceholder: 'e.g., Teeth Cleaning, Root Canal, Dental Exam',
      descriptionPlaceholder: 'Describe the treatment procedure, what\'s included, and any preparation needed...',
      categoryLabel: 'Treatment Category',
      durationLabel: 'Procedure Duration (minutes)',
    },
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'treatments', title: 'Treatments', enabled: true },
      { id: 'notes', title: 'Notes', enabled: true },
      { id: 'prescriptions', title: 'Prescriptions', enabled: true },
      { id: 'treatment-plan', title: 'Treatment Plan', enabled: true },
      { id: 'billing', title: 'Billing', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'patients',
      'prescriptions',
      'treatment-plans',
      'services',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a helpful AI assistant for a dental clinic. Be professional, empathetic, and provide clear information about dental services. Always prioritize patient comfort and address any concerns about pain or anxiety. When discussing treatments, explain procedures in simple, non-technical terms. If someone mentions pain or emergency, prioritize urgent care options.`,
      greeting: `Hi! I'm your dental clinic's AI assistant. I'm here to help you book appointments, answer questions about our services, and provide general dental health information. How can I assist you today?`,
      personalityTraits: ['Professional', 'Empathetic', 'Patient', 'Clear'],
    },
  },
  
  hairdresser: {
    id: 'hairdresser',
    name: 'Hair Salon / Barbershop',
    description: 'Complete salon management with automatic tier detection - from solo stylists to multi-location chains',
    icon: Scissors,
    features: {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    },
    terminology: {
      customer: 'Client',
      customerPlural: 'Clients',
      provider: 'Stylist',
      providerPlural: 'Stylists',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Salon',
    },
    appointmentReasons: [
      'Haircut',
      'Color',
      'Styling',
    ],
    defaultServices: [
      'Haircut',
      'Hair Color',
      'Styling',
    ],
    serviceCategories: [
      'Haircuts',
      'Coloring',
      'Styling',
    ],
    quickAddServices: [
      { name: 'Haircut', price: 35, duration: 30, description: 'Standard haircut and style', category: 'Haircuts' },
      { name: 'Hair Color', price: 75, duration: 90, description: 'Full color service', category: 'Coloring' },
      { name: 'Highlights', price: 95, duration: 120, description: 'Partial or full highlights', category: 'Coloring' },
      { name: 'Blow Dry & Style', price: 35, duration: 45, description: 'Wash, dry and style', category: 'Styling' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Haircut, Color, Styling',
      descriptionPlaceholder: 'Brief description of the service',
      categoryLabel: 'Category',
      durationLabel: 'Duration (minutes)',
    },
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'services', title: 'Services Provided', enabled: true },
      { id: 'notes', title: 'Notes & Photos', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'patients',
      'services',
      'employees',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a friendly, stylish AI assistant for a hair salon or barbershop. Help clients:
      - Choose the right service based on their hair type, desired look, and occasion
      - Recommend stylists based on their specialties (color, cuts, styling, extensions)
      - Suggest complementary services (e.g., deep conditioning with color, styling with cut)
      - Answer questions about service duration, pricing, and what's included
      - Book appointments quickly and efficiently
      - Explain the difference between services (balayage vs highlights, keratin vs deep conditioning)
      Be warm, professional, and enthusiastic about helping clients look and feel amazing!`,
      greeting: `Hi! 💇‍♀️ Welcome! I'm here to help you find the perfect service and book with the ideal stylist for you. Looking for a cut, color, special styling, or just want to explore? Let me know what you're thinking!`,
      personalityTraits: ['Friendly', 'Enthusiastic', 'Professional', 'Warm', 'Style-Conscious'],
    },
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Restaurant management with table reservations and order tracking',
    icon: UtensilsCrossed,
    features: {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: false,
      appointments: true,
      services: true,
    },
    terminology: {
      customer: 'Customer',
      customerPlural: 'Customers',
      provider: 'Server',
      providerPlural: 'Servers',
      appointment: 'Reservation',
      appointmentPlural: 'Reservations',
      service: 'Menu Item',
      servicePlural: 'Menu Items',
      business: 'Restaurant',
    },
    appointmentReasons: [
      'Dinner Reservation',
      'Lunch Reservation',
      'Breakfast Reservation',
      'Private Event',
      'Walk-in',
    ],
    defaultServices: [
      'Appetizer',
      'Main Course',
      'Dessert',
      'Beverage',
      'Special',
    ],
    serviceCategories: [
      'Appetizers',
      'Main Courses',
      'Desserts',
      'Beverages',
      'Alcoholic Drinks',
      'Non-Alcoholic Drinks',
      'Specials',
      'Kids Menu',
      'Sides',
    ],
    quickAddServices: [
      { name: 'House Salad', price: 8, duration: 15, description: 'Fresh mixed greens with house dressing', category: 'Appetizers' },
      { name: 'Grilled Chicken', price: 18, duration: 25, description: 'Marinated grilled chicken breast with sides', category: 'Main Courses' },
      { name: 'Pasta Carbonara', price: 16, duration: 20, description: 'Classic Italian pasta with bacon and cream sauce', category: 'Main Courses' },
      { name: 'Cheeseburger', price: 14, duration: 20, description: 'Beef burger with cheese, lettuce, and fries', category: 'Main Courses' },
      { name: 'Chocolate Cake', price: 7, duration: 10, description: 'Rich chocolate layer cake', category: 'Desserts' },
      { name: 'Soft Drink', price: 3, duration: 5, description: 'Assorted sodas and soft drinks', category: 'Non-Alcoholic Drinks' },
      { name: 'Beer', price: 6, duration: 5, description: 'Selection of draft and bottled beers', category: 'Alcoholic Drinks' },
      { name: 'Wine Glass', price: 9, duration: 5, description: 'House red or white wine', category: 'Alcoholic Drinks' },
      { name: 'Coffee', price: 3, duration: 5, description: 'Fresh brewed coffee', category: 'Non-Alcoholic Drinks' },
      { name: 'French Fries', price: 5, duration: 10, description: 'Crispy golden fries', category: 'Sides' },
    ],
    serviceFieldLabels: {
      serviceName: 'Menu Item Name',
      serviceNamePlaceholder: 'e.g., Grilled Chicken, Caesar Salad, Chocolate Cake',
      descriptionPlaceholder: 'Describe the dish, ingredients, and preparation...',
      categoryLabel: 'Menu Category',
      durationLabel: 'Preparation Time (minutes)',
    },
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'order-items', title: 'Order Items', enabled: true },
      { id: 'notes', title: 'Notes', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'patients',
      'services',
      'employees',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a friendly restaurant assistant. Help customers make reservations, answer questions about the menu, and provide information about dining options. Be welcoming and make the dining experience smooth and enjoyable.`,
      greeting: `Welcome! I'm here to help you with reservations and answer any questions about our menu. How can I assist you today?`,
      personalityTraits: ['Welcoming', 'Helpful', 'Friendly', 'Efficient'],
    },
  },
  
  generic: {
    id: 'generic',
    name: 'Generic Business',
    description: 'Basic appointment booking system for any business',
    icon: Briefcase,
    features: {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    },
    terminology: {
      customer: 'Customer',
      customerPlural: 'Customers',
      provider: 'Provider',
      providerPlural: 'Providers',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Business',
    },
    appointmentReasons: [
      'Consultation',
      'Service',
      'Follow-up',
      'Meeting',
    ],
    defaultServices: [
      'Standard Service',
      'Consultation',
      'Follow-up',
    ],
    serviceCategories: [
      'Standard Services',
      'Consultations',
      'Premium Services',
      'Packages',
    ],
    quickAddServices: [
      { name: 'Standard Service', price: 50, duration: 60, description: 'Basic professional service offering', category: 'Standard Services' },
      { name: 'Consultation', price: 75, duration: 45, description: 'One-on-one consultation session', category: 'Consultations' },
      { name: 'Follow-up Session', price: 40, duration: 30, description: 'Follow-up appointment or check-in', category: 'Standard Services' },
      { name: 'Premium Service', price: 100, duration: 90, description: 'Enhanced service with premium features', category: 'Premium Services' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Consultation, Standard Service, Premium Package',
      descriptionPlaceholder: 'Describe what this service includes and who it\'s for...',
      categoryLabel: 'Service Category',
      durationLabel: 'Service Duration (minutes)',
    },
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'services', title: 'Services', enabled: true },
      { id: 'notes', title: 'Notes', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'patients',
      'services',
      'employees',
      'messages',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a helpful assistant for a professional service business. Be courteous, efficient, and focused on providing excellent customer service. Help clients understand your offerings, make scheduling easy, and always maintain a professional yet friendly tone.`,
      greeting: `Hello! I'm here to assist you with booking appointments, answering questions about our services, and helping with any inquiries you may have. How can I help you today?`,
      personalityTraits: ['Professional', 'Efficient', 'Helpful', 'Courteous'],
    },
  },
  
  custom: {
    id: 'custom',
    name: 'Custom Template',
    description: 'Fully customizable - choose exactly which features you need',
    icon: Settings,
    features: {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    },
    terminology: {
      customer: 'Customer',
      customerPlural: 'Customers',
      provider: 'Provider',
      providerPlural: 'Providers',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Business',
    },
    appointmentReasons: [
      'Consultation',
      'Service',
      'Follow-up',
      'Meeting',
    ],
    defaultServices: [
      'Standard Service',
      'Consultation',
      'Follow-up',
    ],
    serviceCategories: [
      'Standard Services',
      'Consultations',
      'Premium Services',
      'Packages',
    ],
    quickAddServices: [
      { name: 'Standard Service', price: 50, duration: 60, description: 'Basic professional service offering', category: 'Standard Services' },
      { name: 'Consultation', price: 75, duration: 45, description: 'One-on-one consultation session', category: 'Consultations' },
      { name: 'Follow-up Session', price: 40, duration: 30, description: 'Follow-up appointment or check-in', category: 'Standard Services' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Consultation, Standard Service, Custom Package',
      descriptionPlaceholder: 'Describe what this service includes...',
      categoryLabel: 'Service Category',
      durationLabel: 'Service Duration (minutes)',
    },
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'services', title: 'Services', enabled: true },
      { id: 'notes', title: 'Notes', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'customers',
      'services',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a customizable AI assistant. Adapt your communication style based on the business owner's preferences and help customers with booking, questions, and general inquiries efficiently.`,
      greeting: `Hello! I'm here to help you. How can I assist you today?`,
      personalityTraits: ['Professional', 'Helpful'],
    },
  },
};

export function getTemplateConfig(templateType: TemplateType): TemplateConfig {
  return BUSINESS_TEMPLATES[templateType] || BUSINESS_TEMPLATES.generic;
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(BUSINESS_TEMPLATES);
}
