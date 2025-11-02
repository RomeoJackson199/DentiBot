// Timezone utilities for Europe/Brussels with DST handling
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';
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
 * Takes a date and time string and correctly interprets them as Brussels time
 * before converting to UTC for storage
 */
export function createAppointmentDateTime(date: Date, timeSlot: string): Date {
  // Extract date components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Extract time components
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Create a Date object with exact component values
  // fromZonedTime will interpret these components as Brussels time
  const localDate = new Date(year, month, day, hours, minutes, 0, 0);

  return fromZonedTime(localDate, CLINIC_TIMEZONE);
}

/**
 * Create appointment datetime from date string and time string
 * Interprets the date/time as Brussels timezone and converts to UTC
 */
export function createAppointmentDateTimeFromStrings(dateStr: string, timeStr: string): Date {
  // Parse date components from 'yyyy-MM-dd' format
  const [year, month, day] = dateStr.split('-').map(Number);

  // Parse time components from 'HH:mm' format
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create a Date object with exact component values
  // fromZonedTime will interpret these components as Brussels time
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return fromZonedTime(localDate, CLINIC_TIMEZONE);
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