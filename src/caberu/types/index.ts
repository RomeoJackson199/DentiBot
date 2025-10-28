export type Role = 'client' | 'professional';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId?: string | null;
  profileImg?: string | null;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  ownerName?: string | null;
  professionalsCount?: number;
  servicesCount?: number;
  appointmentsCount?: number;
}

export interface Service {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  duration: number;
  price: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  service: Service;
  client?: { id: string; name: string; email: string };
  professional?: { id: string; name: string; email: string };
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  stripeSession?: string | null;
  appointment?: Appointment;
  createdAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export interface AnalyticsOverview {
  totalAppointments: number;
  revenue: number;
  clients: number;
  weeklyBookings: Array<{ date: string; value: number }>;
}

export interface ChatResponse {
  reply: string;
  suggestedSlots?: Array<{ startTime: string; endTime: string }>;
}
