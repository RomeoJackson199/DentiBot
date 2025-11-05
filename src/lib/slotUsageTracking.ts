import { supabase } from '@/integrations/supabase/client';
import { getCurrentBusinessId } from '@/lib/businessScopedSupabase';
import { format, getDay, getHours } from 'date-fns';

export interface SlotUsageStats {
  time_slot: string;
  day_of_week: number;
  hour_of_day: number;
  booking_rate: number;
  recent_booking_rate: number;
  total_bookings: number;
  recent_bookings: number;
  is_underutilized: boolean;
}

export interface UnderutilizedSlot {
  time_slot: string;
  day_of_week: number;
  booking_rate: number;
  recent_booking_rate: number;
  total_bookings: number;
}

/**
 * Calculates slot usage statistics for a dentist or entire business
 */
export async function calculateSlotUsageStatistics(
  dentistId?: string
): Promise<{ success: boolean; error?: string }> {
  const businessId = await getCurrentBusinessId();

  try {
    const { error } = await supabase.rpc('calculate_slot_usage_statistics', {
      p_business_id: businessId,
      p_dentist_id: dentistId || null
    });

    if (error) {
      console.error('Error calculating slot usage statistics:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error calculating slot usage statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets slot usage statistics for a dentist
 */
export async function getSlotUsageStatistics(
  dentistId: string
): Promise<SlotUsageStats[]> {
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase
    .from('slot_usage_statistics')
    .select('*')
    .eq('business_id', businessId)
    .eq('dentist_id', dentistId)
    .order('recent_booking_rate', { ascending: true });

  if (error) {
    console.error('Error fetching slot usage statistics:', error);
    return [];
  }

  return (data || []).map(stat => ({
    ...stat,
    is_underutilized: stat.recent_booking_rate < 50
  }));
}

/**
 * Gets under-utilized time slots for a dentist
 * These are slots that should be promoted to balance the schedule
 */
export async function getUnderutilizedSlots(
  dentistId: string,
  threshold: number = 50
): Promise<UnderutilizedSlot[]> {
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase.rpc('get_underutilized_slots', {
    p_business_id: businessId,
    p_dentist_id: dentistId,
    p_threshold: threshold
  });

  if (error) {
    console.error('Error fetching underutilized slots:', error);
    return [];
  }

  return data || [];
}

/**
 * Checks if a specific time slot is under-utilized
 */
export async function isSlotUnderutilized(
  dentistId: string,
  date: Date,
  timeSlot: string
): Promise<boolean> {
  const businessId = await getCurrentBusinessId();
  const dayOfWeek = getDay(date);

  const { data, error } = await supabase
    .from('slot_usage_statistics')
    .select('recent_booking_rate, booking_rate')
    .eq('business_id', businessId)
    .eq('dentist_id', dentistId)
    .eq('day_of_week', dayOfWeek)
    .eq('time_slot', timeSlot)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  // Consider under-utilized if recent booking rate is below 50%
  return data.recent_booking_rate < 50;
}

/**
 * Logs when a slot recommendation is made
 */
export async function trackSlotRecommendation(
  dentistId: string,
  timeSlot: string,
  dayOfWeek: number
): Promise<void> {
  const businessId = await getCurrentBusinessId();

  await supabase.rpc('increment_slot_recommendation', {
    p_business_id: businessId,
    p_dentist_id: dentistId,
    p_day_of_week: dayOfWeek,
    p_time_slot: timeSlot
  }).catch(err => {
    // Silently fail if function doesn't exist yet
    console.debug('Could not track recommendation:', err);
  });
}

/**
 * Logs when a recommended slot is selected
 */
export async function trackRecommendationSelection(
  dentistId: string,
  timeSlot: string,
  dayOfWeek: number
): Promise<void> {
  const businessId = await getCurrentBusinessId();

  await supabase.rpc('increment_slot_recommendation_selection', {
    p_business_id: businessId,
    p_dentist_id: dentistId,
    p_day_of_week: dayOfWeek,
    p_time_slot: timeSlot
  }).catch(err => {
    // Silently fail if function doesn't exist yet
    console.debug('Could not track selection:', err);
  });
}

/**
 * Gets booking distribution for visualization
 * Returns the percentage of bookings for each time slot
 */
export async function getBookingDistribution(
  dentistId: string
): Promise<{
  time_slot: string;
  day_of_week: number;
  booking_rate: number;
  label: string;
}[]> {
  const stats = await getSlotUsageStatistics(dentistId);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return stats.map(stat => ({
    time_slot: stat.time_slot,
    day_of_week: stat.day_of_week,
    booking_rate: stat.booking_rate,
    label: `${dayNames[stat.day_of_week]} ${stat.time_slot}`
  }));
}

/**
 * Gets a summary of slot utilization for a dentist
 */
export async function getSlotUtilizationSummary(
  dentistId: string
): Promise<{
  total_slots: number;
  underutilized_slots: number;
  overutilized_slots: number;
  average_booking_rate: number;
  balance_score: number; // 0-100, higher is better balanced
}> {
  const stats = await getSlotUsageStatistics(dentistId);

  if (stats.length === 0) {
    return {
      total_slots: 0,
      underutilized_slots: 0,
      overutilized_slots: 0,
      average_booking_rate: 0,
      balance_score: 0
    };
  }

  const underutilized = stats.filter(s => s.recent_booking_rate < 40).length;
  const overutilized = stats.filter(s => s.recent_booking_rate > 80).length;
  const avgRate = stats.reduce((sum, s) => sum + s.recent_booking_rate, 0) / stats.length;

  // Balance score: perfect balance = 100, imbalanced = 0
  const variance = stats.reduce((sum, s) => {
    return sum + Math.pow(s.recent_booking_rate - avgRate, 2);
  }, 0) / stats.length;

  // Lower variance = better balance
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance));

  return {
    total_slots: stats.length,
    underutilized_slots: underutilized,
    overutilized_slots: overutilized,
    average_booking_rate: Math.round(avgRate * 100) / 100,
    balance_score: Math.round(balanceScore)
  };
}

/**
 * Updates slot statistics after a new appointment is booked
 * This should be called after each successful booking
 */
export async function updateSlotStatisticsAfterBooking(
  dentistId: string,
  appointmentDate: Date
): Promise<void> {
  const businessId = await getCurrentBusinessId();
  const dayOfWeek = getDay(appointmentDate);
  const hour = getHours(appointmentDate);
  const timeSlot = format(appointmentDate, 'HH:mm');

  // Increment booking count for this slot
  const { error } = await supabase
    .from('slot_usage_statistics')
    .upsert({
      business_id: businessId,
      dentist_id: dentistId,
      day_of_week: dayOfWeek,
      hour_of_day: hour,
      time_slot: timeSlot,
      total_bookings: 1,
      recent_bookings: 1,
      last_calculated_at: new Date().toISOString()
    }, {
      onConflict: 'business_id,dentist_id,day_of_week,time_slot',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error updating slot statistics:', error);
  }

  // Recalculate full statistics periodically (don't wait for it)
  setTimeout(() => {
    calculateSlotUsageStatistics(dentistId);
  }, 1000);
}
