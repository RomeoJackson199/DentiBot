import { 
  Scissors, Stethoscope, Dumbbell, Sparkles, Building2, Briefcase 
} from 'lucide-react';

export type TemplateType = 
  | 'dentist' 
  | 'hairdresser' 
  | 'personal_trainer' 
  | 'beauty_salon' 
  | 'medical' 
  | 'generic';

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
}

export interface CompletionStep {
  id: string;
  title: string;
  enabled: boolean;
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
  quickAddServices: QuickAddService[];
  completionSteps: CompletionStep[];
  navigationItems: string[];
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
    quickAddServices: [
      { name: 'Routine Cleaning', price: 80, duration: 30 },
      { name: 'Dental Examination', price: 50, duration: 20 },
      { name: 'X-Ray', price: 35, duration: 15 },
      { name: 'Filling', price: 120, duration: 45 },
      { name: 'Tooth Extraction', price: 150, duration: 30 },
      { name: 'Root Canal', price: 400, duration: 90 },
    ],
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
  },
  
  hairdresser: {
    id: 'hairdresser',
    name: 'Hair Salon',
    description: 'Simple booking system for hair salons with services and photo gallery',
    icon: Scissors,
    features: {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: false, // Disabled for hairdresser
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
      'Highlights',
      'Styling',
      'Treatment',
      'Consultation',
    ],
    defaultServices: [
      'Haircut',
      'Hair Color',
      'Highlights',
      'Blowout',
      'Hair Treatment',
    ],
    quickAddServices: [
      { name: 'Haircut', price: 35, duration: 30 },
      { name: 'Hair Color', price: 85, duration: 90 },
      { name: 'Highlights', price: 120, duration: 120 },
      { name: 'Blowout', price: 40, duration: 45 },
      { name: 'Hair Treatment', price: 55, duration: 60 },
      { name: 'Styling', price: 50, duration: 45 },
    ],
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
      'clients',
      'services',
      'analytics',
      'settings',
    ],
  },
  
  personal_trainer: {
    id: 'personal_trainer',
    name: 'Personal Training',
    description: 'Fitness training business with session booking and progress tracking',
    icon: Dumbbell,
    features: {
      prescriptions: false,
      treatmentPlans: true, // Used as "workout plans"
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
      provider: 'Trainer',
      providerPlural: 'Trainers',
      appointment: 'Session',
      appointmentPlural: 'Sessions',
      service: 'Training Package',
      servicePlural: 'Training Packages',
      business: 'Gym',
    },
    appointmentReasons: [
      'Personal Training',
      'Group Session',
      'Assessment',
      'Consultation',
      'Follow-up',
    ],
    defaultServices: [
      'Personal Training Session',
      '10-Session Package',
      'Initial Assessment',
      'Group Training',
      'Nutrition Consultation',
    ],
    quickAddServices: [
      { name: 'Personal Training Session', price: 60, duration: 60 },
      { name: '10-Session Package', price: 500, duration: 60 },
      { name: 'Initial Assessment', price: 50, duration: 45 },
      { name: 'Group Training', price: 30, duration: 60 },
      { name: 'Nutrition Consultation', price: 75, duration: 45 },
    ],
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'session-notes', title: 'Session Notes', enabled: true },
      { id: 'workout-plan', title: 'Workout Plan', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'sessions',
      'clients',
      'workout-plans',
      'services',
      'analytics',
      'settings',
    ],
  },
  
  beauty_salon: {
    id: 'beauty_salon',
    name: 'Beauty Salon',
    description: 'Beauty services with appointments and photo portfolio',
    icon: Sparkles,
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
      provider: 'Specialist',
      providerPlural: 'Specialists',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Salon',
    },
    appointmentReasons: [
      'Facial',
      'Manicure',
      'Pedicure',
      'Waxing',
      'Massage',
      'Consultation',
    ],
    defaultServices: [
      'Facial Treatment',
      'Manicure',
      'Pedicure',
      'Full Body Massage',
      'Waxing',
    ],
    quickAddServices: [
      { name: 'Facial Treatment', price: 75, duration: 60 },
      { name: 'Manicure', price: 35, duration: 45 },
      { name: 'Pedicure', price: 45, duration: 60 },
      { name: 'Full Body Massage', price: 90, duration: 90 },
      { name: 'Waxing', price: 40, duration: 30 },
      { name: 'Eyelash Extensions', price: 120, duration: 120 },
    ],
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'services', title: 'Services Provided', enabled: true },
      { id: 'notes', title: 'Notes', enabled: true },
      { id: 'billing', title: 'Payment', enabled: true },
      { id: 'complete', title: 'Complete', enabled: true },
    ],
    navigationItems: [
      'dashboard',
      'appointments',
      'clients',
      'services',
      'analytics',
      'settings',
    ],
  },
  
  medical: {
    id: 'medical',
    name: 'Medical Practice',
    description: 'General medical practice with full medical features',
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
      provider: 'Doctor',
      providerPlural: 'Doctors',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Practice',
    },
    appointmentReasons: [
      'Check-up',
      'Follow-up',
      'Emergency',
      'Consultation',
      'Lab Results',
      'Vaccination',
    ],
    defaultServices: [
      'General Consultation',
      'Annual Check-up',
      'Follow-up Visit',
      'Emergency Visit',
      'Lab Work',
    ],
    quickAddServices: [
      { name: 'General Consultation', price: 100, duration: 30 },
      { name: 'Annual Check-up', price: 150, duration: 45 },
      { name: 'Follow-up Visit', price: 75, duration: 20 },
      { name: 'Emergency Visit', price: 200, duration: 30 },
      { name: 'Lab Work', price: 50, duration: 15 },
      { name: 'Vaccination', price: 35, duration: 10 },
    ],
    completionSteps: [
      { id: 'overview', title: 'Overview', enabled: true },
      { id: 'diagnosis', title: 'Diagnosis', enabled: true },
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
    quickAddServices: [
      { name: 'Standard Service', price: 50, duration: 60 },
      { name: 'Consultation', price: 75, duration: 45 },
      { name: 'Follow-up', price: 40, duration: 30 },
    ],
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
  },
};

export function getTemplateConfig(templateType: TemplateType): TemplateConfig {
  return BUSINESS_TEMPLATES[templateType] || BUSINESS_TEMPLATES.generic;
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(BUSINESS_TEMPLATES);
}
