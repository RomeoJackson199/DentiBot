import { 
  Scissors, Stethoscope, UtensilsCrossed, Briefcase, Settings 
} from 'lucide-react';

export type TemplateType = 'healthcare';

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

export interface LayoutCustomization {
  primaryColor?: string;
  dashboardLayout?: 'default' | 'compact' | 'detailed';
  showQuickStats?: boolean;
  showUpcomingAppointments?: boolean;
  showRecentActivity?: boolean;
  showRevenueChart?: boolean;
  cardStyle?: 'elevated' | 'flat' | 'outlined';
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
  layoutCustomization?: LayoutCustomization;
}

export const BUSINESS_TEMPLATES: Record<TemplateType, TemplateConfig> = {
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare Clinic',
    description: 'Full-featured healthcare practice with prescriptions, treatment plans, and medical records',
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
      provider: 'Provider',
      providerPlural: 'Providers',
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
      systemBehavior: `You are a helpful AI assistant for a healthcare clinic. Be professional, empathetic, and provide clear information about healthcare services. Always prioritize patient comfort and address any concerns about pain or anxiety. When discussing treatments, explain procedures in simple, non-technical terms. If someone mentions pain or emergency, prioritize urgent care options.`,
      greeting: `Hi! I'm your healthcare clinic's AI assistant. I'm here to help you book appointments, answer questions about our services, and provide general health information. How can I assist you today?`,
      personalityTraits: ['Professional', 'Empathetic', 'Patient', 'Clear'],
    },
  },
};

export function getTemplateConfig(templateType: TemplateType): TemplateConfig {
  return BUSINESS_TEMPLATES[templateType];
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(BUSINESS_TEMPLATES);
}
