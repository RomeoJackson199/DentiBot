import { 
  Scissors, Stethoscope, Dumbbell, Sparkles, Building2, Briefcase, Settings 
} from 'lucide-react';

export type TemplateType = 
  | 'dentist' 
  | 'hairdresser' 
  | 'personal_trainer' 
  | 'beauty_salon' 
  | 'medical' 
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
    serviceCategories: [
      'Haircuts',
      'Coloring',
      'Highlights & Balayage',
      'Styling',
      'Hair Treatment',
      'Extensions',
      'Bridal Services',
      'Men\'s Grooming',
      'Kids Cuts',
    ],
    quickAddServices: [
      { name: 'Women\'s Haircut', price: 45, duration: 45, description: 'Cut and style for all hair lengths', category: 'Haircuts' },
      { name: 'Men\'s Haircut', price: 30, duration: 30, description: 'Classic or modern men\'s cut', category: 'Men\'s Grooming' },
      { name: 'Full Color', price: 85, duration: 90, description: 'All-over permanent or semi-permanent color', category: 'Coloring' },
      { name: 'Highlights', price: 120, duration: 120, description: 'Foil highlights with toner', category: 'Highlights & Balayage' },
      { name: 'Balayage', price: 150, duration: 150, description: 'Hand-painted highlights for natural look', category: 'Highlights & Balayage' },
      { name: 'Blowout', price: 40, duration: 45, description: 'Wash, blow-dry, and style', category: 'Styling' },
      { name: 'Deep Conditioning', price: 55, duration: 60, description: 'Restorative hair treatment with mask', category: 'Hair Treatment' },
      { name: 'Keratin Treatment', price: 200, duration: 180, description: 'Smoothing and straightening treatment', category: 'Hair Treatment' },
      { name: 'Hair Extensions', price: 300, duration: 180, description: 'Tape-in or clip-in extensions', category: 'Extensions' },
      { name: 'Updo Styling', price: 75, duration: 60, description: 'Formal updo for special occasions', category: 'Bridal Services' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Women\'s Haircut, Balayage, Blowout',
      descriptionPlaceholder: 'Describe the service, hair type suitability, and what\'s included...',
      categoryLabel: 'Service Category',
      durationLabel: 'Service Duration (minutes)',
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
      'clients',
      'services',
      'analytics',
      'settings',
    ],
    aiBehaviorDefaults: {
      systemBehavior: `You are a friendly assistant for a hair salon. Be warm, style-conscious, and help clients discover the perfect look. Discuss current trends, provide style suggestions, and make booking appointments easy and fun. Always be enthusiastic about helping clients look their best.`,
      greeting: `Welcome to our salon! 💇 I'm here to help you book appointments, explore our services, and answer any questions about styles and treatments. What would you like to know?`,
      personalityTraits: ['Friendly', 'Enthusiastic', 'Trendy', 'Warm'],
    },
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
    serviceCategories: [
      'Personal Training',
      'Group Classes',
      'Packages',
      'Nutrition Services',
      'Assessments',
      'Specialized Training',
      'Online Coaching',
    ],
    quickAddServices: [
      { name: 'Personal Training Session', price: 60, duration: 60, description: 'One-on-one customized training session', category: 'Personal Training' },
      { name: '10-Session Package', price: 500, duration: 60, description: 'Package of 10 personal training sessions', category: 'Packages' },
      { name: 'Initial Fitness Assessment', price: 50, duration: 45, description: 'Comprehensive fitness evaluation and goal setting', category: 'Assessments' },
      { name: 'Group Training Class', price: 30, duration: 60, description: 'High-energy group workout session', category: 'Group Classes' },
      { name: 'Nutrition Consultation', price: 75, duration: 45, description: 'Personalized meal planning and nutrition guidance', category: 'Nutrition Services' },
      { name: 'HIIT Training', price: 65, duration: 45, description: 'High-intensity interval training session', category: 'Specialized Training' },
      { name: 'Strength Training', price: 65, duration: 60, description: 'Focused weightlifting and muscle building', category: 'Specialized Training' },
      { name: 'Online Coaching Program', price: 150, duration: 30, description: 'Monthly online training and check-ins', category: 'Online Coaching' },
    ],
    serviceFieldLabels: {
      serviceName: 'Package/Session Name',
      serviceNamePlaceholder: 'e.g., Personal Training Session, HIIT Class, 5-Session Package',
      descriptionPlaceholder: 'Describe the training focus, fitness level, and what clients will achieve...',
      categoryLabel: 'Training Category',
      durationLabel: 'Session Duration (minutes)',
    },
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
    aiBehaviorDefaults: {
      systemBehavior: `You are a motivating fitness assistant for a personal training business. Be energetic, supportive, and focused on helping clients achieve their fitness goals. Provide encouragement, explain workout benefits clearly, and help clients stay committed to their health journey. Always emphasize progress over perfection.`,
      greeting: `Hey there! 💪 Ready to crush your fitness goals? I'm here to help you schedule training sessions, learn about our programs, and answer any fitness-related questions. Let's get started!`,
      personalityTraits: ['Motivating', 'Energetic', 'Supportive', 'Positive'],
    },
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
    serviceCategories: [
      'Facials',
      'Nails',
      'Massage',
      'Waxing & Hair Removal',
      'Eyelashes & Brows',
      'Makeup Services',
      'Skin Treatments',
      'Body Treatments',
      'Bridal Packages',
    ],
    quickAddServices: [
      { name: 'Deep Cleansing Facial', price: 75, duration: 60, description: 'Exfoliating facial with extractions and mask', category: 'Facials' },
      { name: 'Classic Manicure', price: 35, duration: 45, description: 'Nail shaping, cuticle care, and polish', category: 'Nails' },
      { name: 'Spa Pedicure', price: 50, duration: 60, description: 'Foot soak, scrub, massage, and polish', category: 'Nails' },
      { name: 'Full Body Massage', price: 90, duration: 90, description: 'Relaxing Swedish or deep tissue massage', category: 'Massage' },
      { name: 'Brazilian Wax', price: 55, duration: 30, description: 'Professional bikini waxing service', category: 'Waxing & Hair Removal' },
      { name: 'Eyelash Extensions', price: 120, duration: 120, description: 'Individual lash extension application', category: 'Eyelashes & Brows' },
      { name: 'Gel Manicure', price: 45, duration: 60, description: 'Long-lasting gel polish manicure', category: 'Nails' },
      { name: 'Microblading', price: 350, duration: 150, description: 'Semi-permanent eyebrow enhancement', category: 'Eyelashes & Brows' },
      { name: 'Bridal Makeup', price: 150, duration: 90, description: 'Professional makeup application for weddings', category: 'Makeup Services' },
      { name: 'Anti-Aging Facial', price: 120, duration: 75, description: 'Rejuvenating treatment with serums and LED therapy', category: 'Skin Treatments' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., Deep Cleansing Facial, Gel Manicure, Full Body Massage',
      descriptionPlaceholder: 'Describe the treatment process, benefits, and what clients can expect...',
      categoryLabel: 'Service Category',
      durationLabel: 'Treatment Duration (minutes)',
    },
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
    aiBehaviorDefaults: {
      systemBehavior: `You are a welcoming assistant for a beauty salon. Be friendly, knowledgeable about beauty services, and help clients feel pampered and special. Discuss treatments, provide relaxation tips, and make the booking experience smooth and delightful. Always emphasize self-care and wellness.`,
      greeting: `Welcome to our beauty sanctuary! ✨ I'm here to help you discover our luxurious services, book your pampering session, and answer any questions about treatments. How can I help you relax and rejuvenate today?`,
      personalityTraits: ['Welcoming', 'Relaxing', 'Luxurious', 'Caring'],
    },
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
    serviceCategories: [
      'Consultations',
      'Preventive Care',
      'Diagnostic Services',
      'Vaccinations',
      'Minor Procedures',
      'Wellness Exams',
      'Chronic Care Management',
      'Specialist Referrals',
    ],
    quickAddServices: [
      { name: 'General Consultation', price: 100, duration: 30, description: 'Comprehensive medical consultation for acute or chronic conditions', category: 'Consultations' },
      { name: 'Annual Physical Exam', price: 150, duration: 45, description: 'Complete yearly health check-up with lab orders', category: 'Wellness Exams' },
      { name: 'Follow-up Visit', price: 75, duration: 20, description: 'Check progress after initial consultation or treatment', category: 'Consultations' },
      { name: 'Emergency Visit', price: 200, duration: 30, description: 'Urgent medical care for acute conditions', category: 'Consultations' },
      { name: 'Blood Work', price: 50, duration: 15, description: 'Laboratory blood tests and analysis', category: 'Diagnostic Services' },
      { name: 'Flu Vaccination', price: 35, duration: 10, description: 'Annual influenza immunization', category: 'Vaccinations' },
      { name: 'EKG', price: 80, duration: 20, description: 'Electrocardiogram heart monitoring', category: 'Diagnostic Services' },
      { name: 'Minor Wound Care', price: 120, duration: 30, description: 'Cleaning, stitching, and dressing of wounds', category: 'Minor Procedures' },
    ],
    serviceFieldLabels: {
      serviceName: 'Service Name',
      serviceNamePlaceholder: 'e.g., General Consultation, Annual Physical, Vaccination',
      descriptionPlaceholder: 'Describe the medical service, what it includes, and any preparation needed...',
      categoryLabel: 'Medical Service Category',
      durationLabel: 'Appointment Duration (minutes)',
    },
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
    aiBehaviorDefaults: {
      systemBehavior: `You are a professional medical assistant for a healthcare practice. Be compassionate, accurate, and provide clear health information. Always maintain patient privacy, address concerns with empathy, and prioritize urgent medical needs. Explain medical procedures in simple terms and emphasize the importance of following medical advice.`,
      greeting: `Hello! I'm the AI assistant for our medical practice. I can help you schedule appointments, answer questions about our services, and provide general health information. How may I assist you today?`,
      personalityTraits: ['Professional', 'Compassionate', 'Clear', 'Trustworthy'],
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
      'customers',
      'services',
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
