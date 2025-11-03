import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay, addMinutes } from 'date-fns';
import { logger } from '@/lib/logger';
import { getCurrentBusinessId } from '@/lib/businessScopedSupabase';

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: 'booked' | 'vacation' | 'outside_hours' | 'emergency_only';
  appointmentId?: string;
}

export interface DentistAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
}

/**
 * Fetches real-time availability for a dentist on a specific date
 * Considers: existing appointments, vacation days, working hours, and emergency slots
 */
export async function fetchDentistAvailability(
  dentistId: string,
  date: Date
): Promise<TimeSlot[]> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay();
  const businessId = await getCurrentBusinessId();

  // Parallel fetch of all availability data
  const [
    availabilityResult,
    vacationResult,
    appointmentsResult,
    slotsResult
  ] = await Promise.all([
    // Get dentist's working hours for this day
    supabase
      .from('dentist_availability')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('day_of_week', dayOfWeek)
      .eq('business_id', businessId)
      .maybeSingle(),
    
    // Check if dentist is on vacation
    supabase
      .from('dentist_vacation_days')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('business_id', businessId)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .eq('is_approved', true)
      .maybeSingle(),
    
    // Get existing appointments for this date
    supabase
      .from('appointments')
      .select('id, appointment_date, status')
      .eq('dentist_id', dentistId)
      .eq('business_id', businessId)
      .gte('appointment_date', `${dateStr}T00:00:00`)
      .lte('appointment_date', `${dateStr}T23:59:59`)
      .neq('status', 'cancelled'),
    
    // Get appointment slots
    supabase
      .from('appointment_slots')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('slot_date', dateStr)
      .eq('business_id', businessId)
  ]);

  // Check for errors
  if (availabilityResult.error) {
    console.error('Error fetching availability:', availabilityResult.error);
  }
  if (vacationResult.error) {
    console.error('Error fetching vacation:', vacationResult.error);
  }
  if (appointmentsResult.error) {
    console.error('Error fetching appointments:', appointmentsResult.error);
  }
  if (slotsResult.error) {
    console.error('Error fetching slots:', slotsResult.error);
  }

  const availability = availabilityResult.data;
  const vacation = vacationResult.data;
  const appointments = appointmentsResult.data || [];
  const slots = slotsResult.data || [];

  // If the dentist is not working on this day, return closed slots regardless of generated slots
  if (availability && availability.is_available === false) {
    return generateTimeSlots(date).map(time => ({
      time,
      available: false,
      reason: 'outside_hours'
    }));
  }

  // If dentist is on vacation, return empty slots with vacation reason
  if (vacation) {
    return generateTimeSlots(date).map(time => ({
      time,
      available: false,
      reason: 'vacation'
    }));
  }

  // PRIORITY 1: If appointment_slots exist, use them as the primary source
  if (slots && slots.length > 0) {
    return slots.map(slot => {
      // Ensure time format includes seconds (HH:mm:ss)
      const formattedTime = slot.slot_time.length === 5 ? `${slot.slot_time}:00` : slot.slot_time;
      return {
        time: formattedTime,
        available: slot.is_available && !slot.emergency_only,
        reason: !slot.is_available ? 'booked' : (slot.emergency_only ? 'emergency_only' : undefined),
        appointmentId: slot.appointment_id || undefined
      };
    });
  }

  // PRIORITY 2: Fall back to dentist_availability + appointments if no slots
  // Compute effective availability with sensible defaults (Mon-Fri 09:00-17:00)
  const defaultAvailability: DentistAvailability = {
    day_of_week: dayOfWeek,
    start_time: '09:00:00',
    end_time: '17:00:00',
    is_available: dayOfWeek >= 1 && dayOfWeek <= 5,
    break_start_time: '12:00:00',
    break_end_time: '13:00:00',
  };
  const effectiveAvailability = availability || defaultAvailability;

  if (!effectiveAvailability.is_available) {
    return generateTimeSlots(date).map(time => ({
      time,
      available: false,
      reason: 'outside_hours'
    }));
  }

  // Generate all possible time slots for the day
  const allTimeSlots = generateTimeSlots(date, effectiveAvailability.start_time, effectiveAvailability.end_time);

  // Map slots to availability status
  const timeSlots: TimeSlot[] = allTimeSlots.map(timeStr => {
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    
    // Check if it's during break time
    if (effectiveAvailability.break_start_time && effectiveAvailability.break_end_time) {
      const breakStart = new Date(`${dateStr}T${effectiveAvailability.break_start_time}`);
      const breakEnd = new Date(`${dateStr}T${effectiveAvailability.break_end_time}`);
      if (slotDateTime >= breakStart && slotDateTime < breakEnd) {
        return {
          time: timeStr,
          available: false,
          reason: 'outside_hours'
        };
      }
    }

    // Check if slot exists in appointment_slots table
    const slotRecord = slots.find(s => s.slot_time === timeStr);
    
    // If slot is marked as emergency only
    if (slotRecord?.emergency_only) {
      return {
        time: timeStr,
        available: false,
        reason: 'emergency_only'
      };
    }

    // If slot is explicitly marked as unavailable
    if (slotRecord && !slotRecord.is_available) {
      return {
        time: timeStr,
        available: false,
        reason: 'booked',
        appointmentId: slotRecord.appointment_id || undefined
      };
    }

    // Check if there's an appointment at this time (assuming 30-min default duration)
    const appointment = appointments.find(apt => {
      const aptTime = parseISO(apt.appointment_date);
      const aptEndTime = addMinutes(aptTime, 30);
      return slotDateTime >= aptTime && slotDateTime < aptEndTime;
    });

    if (appointment) {
      return {
        time: timeStr,
        available: false,
        reason: 'booked',
        appointmentId: appointment.id
      };
    }

    // Slot is available
    return {
      time: timeStr,
      available: true
    };
  });

  return timeSlots;
}

/**
 * Generates time slots for a day
 * @param date - The date to generate slots for
 * @param startTime - Start time (e.g., "09:00:00")
 * @param endTime - End time (e.g., "17:00:00")
 * @param intervalMinutes - Slot duration in minutes (default: 30)
 */
function generateTimeSlots(
  date: Date,
  startTime = '08:00:00',
  endTime = '18:00:00',
  intervalMinutes = 30
): string[] {
  const slots: string[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  
  let currentTime = new Date(`${dateStr}T${startTime}`);
  const endDateTime = new Date(`${dateStr}T${endTime}`);

  while (currentTime < endDateTime) {
    slots.push(format(currentTime, 'HH:mm:ss'));
    currentTime = addMinutes(currentTime, intervalMinutes);
  }

  return slots;
}

/**
 * Checks if a dentist is available on a specific date
 */
export async function isDentistAvailableOnDate(
  dentistId: string,
  date: Date
): Promise<{ available: boolean; reason?: string }> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay();
  const businessId = await getCurrentBusinessId();

  // Check vacation
  const { data: vacation } = await supabase
    .from('dentist_vacation_days')
    .select('vacation_type, reason')
    .eq('dentist_id', dentistId)
    .eq('business_id', businessId)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .eq('is_approved', true)
    .maybeSingle();

  if (vacation) {
    return {
      available: false,
      reason: `On ${vacation.vacation_type}${vacation.reason ? `: ${vacation.reason}` : ''}`
    };
  }

  // Check dentist working day first
  const { data: availability } = await supabase
    .from('dentist_availability')
    .select('is_available')
    .eq('dentist_id', dentistId)
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (availability && availability.is_available === false) {
    return {
      available: false,
      reason: 'Not working on this day'
    };
  }

  // Check appointment slots next
  const { data: slots } = await supabase
    .from('appointment_slots')
    .select('is_available, emergency_only')
    .eq('dentist_id', dentistId)
    .eq('slot_date', dateStr)
    .eq('business_id', businessId);

  if (slots && slots.length > 0) {
    const hasAvailableSlots = slots.some(s => s.is_available && !s.emergency_only);
    return { available: hasAvailableSlots };
  }

  // If no data, default to unavailable
  return { available: false, reason: 'No slots or schedule' };
}

/**
 * Format time slot for display (e.g., "09:00:00" -> "9:00 AM")
 */
export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
