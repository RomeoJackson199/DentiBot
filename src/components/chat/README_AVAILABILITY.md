# AI Chat Availability System

## Overview
The AI chat booking system now shows **real-time availability** with visual indicators:
- 🟢 **Green** = Available slots
- 🔴 **Red** = Vacation days (dentist unavailable)
- ⚫ **Gray** = Booked/Unavailable slots
- 🟠 **Orange** = Emergency-only slots

## How It Works

### 1. Calendar Widget (`InlineCalendarWidget`)
- Automatically checks for dentist vacation days
- Disables dates when dentist doesn't work (based on `dentist_availability` table)
- Shows vacation days in red with strikethrough
- Only allows booking on working days

### 2. Time Slots Widget (`TimeSlotsWidget`)
- Fetches real availability using `fetchDentistAvailability()` function
- Considers:
  - Existing appointments (from `appointments` table)
  - Dentist working hours (from `dentist_availability` table)
  - Vacation days (from `dentist_vacation_days` table)
  - Emergency-only slots (from `appointment_slots` table)
- Shows visual indicators with colors and icons
- Displays reason for unavailability on hover

### 3. Availability Checking (`src/lib/appointmentAvailability.ts`)

The system uses a comprehensive availability checker that:

```typescript
fetchDentistAvailability(dentistId: string, date: Date): Promise<TimeSlot[]>
```

**Checks performed:**
1. ✅ Dentist vacation days
2. ✅ Dentist working hours for day of week
3. ✅ Existing appointments (booked slots)
4. ✅ Break times
5. ✅ Emergency-only restrictions
6. ✅ Appointment slots availability

**Returns:**
```typescript
interface TimeSlot {
  time: string;              // "09:00:00"
  available: boolean;        // true/false
  reason?: string;           // 'booked' | 'vacation' | 'outside_hours' | 'emergency_only'
  appointmentId?: string;    // If booked
}
```

## Database Tables Used

### `dentist_availability`
- Stores working hours per day of week
- Includes break times
- Can mark specific days as unavailable

### `dentist_vacation_days`
- Stores vacation periods
- Requires approval (`is_approved`)
- Includes vacation type and reason

### `appointments`
- All scheduled appointments
- Used to mark booked time slots
- Includes duration_minutes

### `appointment_slots`
- Pre-generated time slots
- Can mark slots as emergency_only
- Tracks which appointment booked each slot

## Usage in AI Chat

When a patient books through the AI chat:

1. **Select Dentist** → Shows active dentists
2. **Select Date** → Calendar shows:
   - Available dates in white
   - Vacation days in red (crossed out)
   - Past dates disabled
3. **Select Time** → Time slots show:
   - Available times in green
   - Booked times in gray (with X icon)
   - Vacation slots in red
   - All unavailable slots are disabled

## Admin: Setting Vacation Days

Dentists can set vacation days via:
```sql
INSERT INTO dentist_vacation_days (
  dentist_id,
  start_date,
  end_date,
  vacation_type,
  reason,
  is_approved
) VALUES (
  'dentist-uuid',
  '2025-01-15',
  '2025-01-20',
  'vacation',
  'Family holiday',
  true
);
```

## Admin: Setting Working Hours

Set dentist availability:
```sql
INSERT INTO dentist_availability (
  dentist_id,
  day_of_week,  -- 0=Sunday, 1=Monday, etc.
  start_time,
  end_time,
  break_start_time,
  break_end_time,
  is_available
) VALUES (
  'dentist-uuid',
  1,  -- Monday
  '09:00:00',
  '17:00:00',
  '12:00:00',
  '13:00:00',
  true
);
```

## Future Enhancements

Potential additions:
- [ ] Multi-dentist vacation calendar view
- [ ] Recurring vacation patterns (e.g., holidays)
- [ ] Automatic slot generation based on availability
- [ ] Patient notifications when dentist returns from vacation
- [ ] Waitlist for fully booked days
