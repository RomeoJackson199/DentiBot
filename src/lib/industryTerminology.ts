export type IndustryType = 
  | 'healthcare' 
  | 'fitness' 
  | 'beauty' 
  | 'consulting' 
  | 'legal' 
  | 'education' 
  | 'other';

export interface IndustryTerminology {
  provider: string;
  providers: string;
  client: string;
  clients: string;
  appointment: string;
  appointments: string;
  service: string;
  services: string;
  payment: string;
  payments: string;
}

export const industryTerminology: Record<IndustryType, IndustryTerminology> = {
  healthcare: {
    provider: 'Doctor',
    providers: 'Doctors',
    client: 'Patient',
    clients: 'Patients',
    appointment: 'Appointment',
    appointments: 'Appointments',
    service: 'Treatment',
    services: 'Treatments',
    payment: 'Bill',
    payments: 'Bills',
  },
  fitness: {
    provider: 'Trainer',
    providers: 'Trainers',
    client: 'Member',
    clients: 'Members',
    appointment: 'Session',
    appointments: 'Sessions',
    service: 'Workout',
    services: 'Workouts',
    payment: 'Payment',
    payments: 'Payments',
  },
  beauty: {
    provider: 'Stylist',
    providers: 'Stylists',
    client: 'Client',
    clients: 'Clients',
    appointment: 'Appointment',
    appointments: 'Appointments',
    service: 'Service',
    services: 'Services',
    payment: 'Payment',
    payments: 'Payments',
  },
  consulting: {
    provider: 'Consultant',
    providers: 'Consultants',
    client: 'Client',
    clients: 'Clients',
    appointment: 'Meeting',
    appointments: 'Meetings',
    service: 'Consultation',
    services: 'Consultations',
    payment: 'Invoice',
    payments: 'Invoices',
  },
  legal: {
    provider: 'Attorney',
    providers: 'Attorneys',
    client: 'Client',
    clients: 'Clients',
    appointment: 'Consultation',
    appointments: 'Consultations',
    service: 'Legal Service',
    services: 'Legal Services',
    payment: 'Invoice',
    payments: 'Invoices',
  },
  education: {
    provider: 'Instructor',
    providers: 'Instructors',
    client: 'Student',
    clients: 'Students',
    appointment: 'Class',
    appointments: 'Classes',
    service: 'Lesson',
    services: 'Lessons',
    payment: 'Tuition',
    payments: 'Tuition Payments',
  },
  other: {
    provider: 'Provider',
    providers: 'Providers',
    client: 'Client',
    clients: 'Clients',
    appointment: 'Appointment',
    appointments: 'Appointments',
    service: 'Service',
    services: 'Services',
    payment: 'Payment',
    payments: 'Payments',
  },
};

export function getTerminology(industry?: IndustryType | null): IndustryTerminology {
  return industryTerminology[industry || 'other'];
}
