// Timezone utilities for Europe/Brussels with DST handling
import { format, parseISO, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, isValid, startOfDay } from 'date-fns';

const CLINIC_TIMEZONE = 'Europe/Brussels';

/**
 * Convert local clinic time to UTC for database storage
 */
export function clinicTimeToUtc(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  return fromZonedTime(dateObj, CLINIC_TIMEZONE);
}

/**
 * Convert UTC time to local clinic time for display
 */
export function utcToClinicTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  return toZonedTime(dateObj, CLINIC_TIMEZONE);
}

/**
 * Format date in clinic timezone
 */
export function formatClinicTime(date: Date | string, formatStr: string = 'PPpp'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return 'Invalid date';
  }
  return format(toZonedTime(dateObj, CLINIC_TIMEZONE), formatStr, { timeZone: CLINIC_TIMEZONE });
}

/**
 * Create appointment datetime in clinic timezone
 */
export function createAppointmentDateTime(date: Date, timeSlot: string): Date {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const appointmentDate = new Date(date);
  appointmentDate.setHours(hours, minutes, 0, 0);
  return fromZonedTime(appointmentDate, CLINIC_TIMEZONE);
}

/**
 * Get available time slots for a given date in clinic timezone
 */
export function getClinicTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const now = new Date();
  const clinicNow = utcToClinicTime(now);
  const selectedDay = startOfDay(date);
  const isToday = selectedDay.getTime() === startOfDay(clinicNow).getTime();

  // Business hours: 7:00 AM to 5:00 PM (17:00)
  for (let hour = 7; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // If it's today, only show future slots (with 1 hour buffer)
      if (isToday) {
        const slotDateTime = new Date(selectedDay);
        slotDateTime.setHours(hour, minute, 0, 0);
        const clinicSlotTime = fromZonedTime(slotDateTime, CLINIC_TIMEZONE);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        
        if (clinicSlotTime <= oneHourFromNow) {
          continue;
        }
      }
      
      slots.push(timeString);
    }
  }
  
  return slots;
}

/**
 * Test DST transitions and slot consistency
 */
export function testDstTransitions() {
  // Test spring DST transition (last Sunday in March)
  const springDst = new Date(2024, 2, 31); // March 31, 2024
  const springSlot = createAppointmentDateTime(springDst, '10:30');
  
  // Test autumn DST transition (last Sunday in October)  
  const autumnDst = new Date(2024, 9, 27); // October 27, 2024
  const autumnSlot = createAppointmentDateTime(autumnDst, '10:30');
  
  return {
    spring: {
      input: { date: springDst, time: '10:30' },
      utc: springSlot,
      displayed: formatClinicTime(springSlot, 'HH:mm'),
    },
    autumn: {
      input: { date: autumnDst, time: '10:30' },
      utc: autumnSlot,
      displayed: formatClinicTime(autumnSlot, 'HH:mm'),
    }
  };
}

/**
 * Validate that times match across portals
 */
export function validateTimeConsistency(utcDateTime: Date): {
  utc: string;
  clinicTime: string;
  isConsistent: boolean;
} {
  const clinicTime = utcToClinicTime(utcDateTime);
  const backToUtc = clinicTimeToUtc(clinicTime);
  
  return {
    utc: format(utcDateTime, 'yyyy-MM-dd HH:mm:ss xxx'),
    clinicTime: formatClinicTime(utcDateTime, 'yyyy-MM-dd HH:mm:ss xxx'),
    isConsistent: Math.abs(utcDateTime.getTime() - backToUtc.getTime()) < 1000, // Allow 1s tolerance
  };
}