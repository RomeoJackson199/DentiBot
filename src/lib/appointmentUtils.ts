// Centralized appointment status and urgency management
import { utcToClinicTime, formatClinicTime } from './timezone';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface AppointmentStatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  canComplete: boolean;
  canCancel: boolean;
  canReschedule: boolean;
}

export interface UrgencyConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;
}

// Appointment status configuration using semantic design tokens
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, AppointmentStatusConfig> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-800',
    borderColor: 'border-warning-300',
    canComplete: true,
    canCancel: true,
    canReschedule: true
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-success-100',
    textColor: 'text-success-800',
    borderColor: 'border-success-300',
    canComplete: true,
    canCancel: true,
    canReschedule: true
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-info-100',
    textColor: 'text-info-800',
    borderColor: 'border-info-300',
    canComplete: false,
    canCancel: false,
    canReschedule: false
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-800',
    borderColor: 'border-danger-300',
    canComplete: false,
    canCancel: false,
    canReschedule: true
  }
};

// Urgency level configuration using semantic design tokens
export const URGENCY_CONFIG: Record<UrgencyLevel, UrgencyConfig> = {
  low: {
    label: 'Low Priority',
    bgColor: 'bg-success-100',
    textColor: 'text-success-800',
    borderColor: 'border-success-300',
    priority: 1
  },
  medium: {
    label: 'Medium Priority',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-800',
    borderColor: 'border-warning-300',
    priority: 2
  },
  high: {
    label: 'High Priority',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-800',
    borderColor: 'border-danger-300',
    priority: 3
  }
};

/**
 * Get status configuration for an appointment
 */
export function getStatusConfig(status: string): AppointmentStatusConfig {
  return APPOINTMENT_STATUS_CONFIG[status as AppointmentStatus] || APPOINTMENT_STATUS_CONFIG.pending;
}

/**
 * Get urgency configuration for an appointment
 */
export function getUrgencyConfig(urgency: string): UrgencyConfig {
  return URGENCY_CONFIG[urgency as UrgencyLevel] || URGENCY_CONFIG.medium;
}

/**
 * Get combined CSS classes for status badge
 */
export function getStatusClasses(status: string): string {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

/**
 * Get combined CSS classes for urgency badge
 */
export function getUrgencyClasses(urgency: string): string {
  const config = getUrgencyConfig(urgency);
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

/**
 * Check if appointment can be completed
 */
export function canCompleteAppointment(status: string): boolean {
  return getStatusConfig(status).canComplete;
}

/**
 * Check if appointment can be cancelled
 */
export function canCancelAppointment(status: string): boolean {
  return getStatusConfig(status).canCancel;
}

/**
 * Check if appointment can be rescheduled
 */
export function canRescheduleAppointment(status: string): boolean {
  return getStatusConfig(status).canReschedule;
}

/**
 * Format appointment date with timezone handling
 */
export function formatAppointmentDate(appointmentDate: string, format = 'MMM dd, yyyy HH:mm'): string {
  return formatClinicTime(appointmentDate, format);
}

/**
 * Get appointment date as clinic timezone Date object
 */
export function getAppointmentDate(appointmentDate: string): Date {
  return utcToClinicTime(appointmentDate);
}

/**
 * Check if appointment is today
 */
export function isAppointmentToday(appointmentDate: string): boolean {
  const appointmentDay = getAppointmentDate(appointmentDate);
  const today = utcToClinicTime(new Date().toISOString());
  
  return appointmentDay.toDateString() === today.toDateString();
}

/**
 * Check if appointment is upcoming (future)
 */
export function isAppointmentUpcoming(appointmentDate: string): boolean {
  const appointmentTime = getAppointmentDate(appointmentDate);
  const now = utcToClinicTime(new Date().toISOString());
  
  return appointmentTime > now;
}

/**
 * Get appointment time remaining in minutes
 */
export function getTimeUntilAppointment(appointmentDate: string): number {
  const appointmentTime = getAppointmentDate(appointmentDate);
  const now = utcToClinicTime(new Date().toISOString());
  
  return Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
}

/**
 * Sort appointments by priority (urgency + date)
 */
export function sortAppointmentsByPriority(appointments: any[]): any[] {
  return appointments.sort((a, b) => {
    const urgencyA = getUrgencyConfig(a.urgency).priority;
    const urgencyB = getUrgencyConfig(b.urgency).priority;
    
    // Sort by urgency first (higher priority first)
    if (urgencyA !== urgencyB) {
      return urgencyB - urgencyA;
    }
    
    // Then by date (earlier appointments first)
    const dateA = new Date(a.appointment_date).getTime();
    const dateB = new Date(b.appointment_date).getTime();
    return dateA - dateB;
  });
}

/**
 * Validate appointment status
 */
export function isValidAppointmentStatus(status: string): status is AppointmentStatus {
  return Object.keys(APPOINTMENT_STATUS_CONFIG).includes(status);
}

/**
 * Validate urgency level
 */
export function isValidUrgencyLevel(urgency: string): urgency is UrgencyLevel {
  return Object.keys(URGENCY_CONFIG).includes(urgency);
}