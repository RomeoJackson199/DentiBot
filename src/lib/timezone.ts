// Timezone utilities for Europe/Brussels with DST handling
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { isValid, startOfDay } from 'date-fns';

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
 */
export function createAppointmentDateTime(date: Date, timeSlot: string): Date {
  // Extract date components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Extract time components
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Create a Date object with exact component values
  // This will be stored as-is (no timezone conversion)
  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Create appointment datetime from date string and time string
 * 
 * IMPORTANT: The slot times from the database are already in Brussels local time.
 * We create the appointment date/time WITHOUT any timezone conversion.
 * When stored in PostgreSQL with toISOString(), the browser's local offset is applied,
 * which for Belgium is correct since the user is in Belgium.
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
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (slotDateTime <= oneHourFromNow) {
          continue;
        }
      }

      slots.push(timeString);
    }
  }

  return slots;
}

/**
 * Format time slot for display (e.g., "09:00" -> "9:00 AM")
 */
export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}