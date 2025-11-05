# 🚀 Smart Scheduling System - Setup Guide

## Overview
This guide will help you integrate the new smart scheduling system into your DentiBot application.

---

## 📋 Prerequisites

Before running the migration, ensure you have:
- Supabase CLI installed
- Database connection configured
- The following tables must already exist:
  - `businesses`
  - `dentists` (with `business_id` column)
  - `profiles`
  - `appointments`

---

## 🗄️ Step 1: Run the Database Migration

### Using Supabase CLI (Recommended)

```bash
# Navigate to your project root
cd /home/user/DentiBot

# Apply the migration
npx supabase db push

# Or if using supabase directly:
supabase db push
```

### Using Supabase Dashboard (Alternative)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of:
   `/supabase/migrations/20251105064008_add_smart_scheduling_system.sql`
4. Click **Run**

---

## 📦 Step 2: What the Migration Does

The migration creates:

### New Tables:
- ✅ **appointment_types** - Define service types (checkup, cleaning, filling, etc.)
- ✅ **patient_preferences** - Track patient booking patterns automatically
- ✅ **dentist_capacity_settings** - Manage workload limits per dentist
- ✅ **slot_recommendations** - Log recommendations for ML learning
- ✅ **reschedule_suggestions** - Track rescheduling suggestions

### New Functions:
- ✅ **calculate_patient_preferences(patient_id, business_id)** - Auto-calculates from history
- ✅ **get_dentist_capacity_usage(dentist_id, date, business_id)** - Returns capacity stats

### Pre-populated Data:
- 5 default appointment types per business:
  - Routine Checkup (30 min + 5 min buffer)
  - Teeth Cleaning (45 min + 10 min buffer)
  - Filling (60 min + 15 min buffer)
  - Emergency (45 min)
  - Consultation (20 min + 5 min buffer)

---

## 🎨 Step 3: Use the New Components

### A. Smart Appointment Booking

Replace your old booking component with the new smart one:

#### In your booking page (e.g., `/src/pages/BookAppointment.tsx`):

```typescript
import { SmartAppointmentBooking } from '@/components/SmartAppointmentBooking';

// Inside your component:
<SmartAppointmentBooking
  user={user}
  onComplete={() => {
    // Handle successful booking
    console.log('Appointment booked!');
    router.push('/appointments');
  }}
  onCancel={() => {
    // Handle cancellation
    router.push('/');
  }}
/>
```

**Features you get:**
- 🎯 Intelligent slot recommendations with scores
- 📊 Real-time capacity indicators
- ⭐ Highlighted recommended times
- 📝 Appointment type selection with durations

---

### B. Capacity Dashboard (For Admins)

Add capacity monitoring to your admin dashboard:

#### In your admin page (e.g., `/src/pages/Admin/Dashboard.tsx`):

```typescript
import { CapacityDashboard } from '@/components/CapacityDashboard';

// Inside your component:
<CapacityDashboard />
```

**Features you get:**
- 📈 Overall utilization metrics
- 👥 Per-dentist capacity breakdown
- ⚠️ Alerts for near-capacity/overbooking
- 📅 Date selector for capacity planning

---

### C. Reschedule Assistant

Add smart rescheduling to your appointment management:

#### In your appointment manager (e.g., `/src/components/AppointmentManager.tsx`):

```typescript
import { RescheduleAssistant } from '@/components/RescheduleAssistant';
import { useState } from 'react';

function AppointmentManager() {
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');

  return (
    <>
      {/* Your existing appointment list */}
      <Button
        onClick={() => {
          setSelectedAppointmentId(appointment.id);
          setRescheduleDialogOpen(true);
        }}
      >
        Reschedule
      </Button>

      {/* Smart Reschedule Assistant */}
      <RescheduleAssistant
        appointmentId={selectedAppointmentId}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onRescheduled={() => {
          // Refresh appointments list
          fetchAppointments();
        }}
        reason="patient_requested"
      />
    </>
  );
}
```

**Features you get:**
- 🤖 Top 3 alternative slot suggestions
- 💯 Match scores with explanations
- ✅ One-click acceptance
- 📱 Automatic notification sending

---

## 🧪 Step 4: Test the System

### Test 1: Create Appointment Types
```sql
-- Verify appointment types were created
SELECT * FROM appointment_types;
-- You should see 5 default types per business
```

### Test 2: Book an Appointment
1. Navigate to the booking page
2. Select a dentist and date
3. You should see:
   - ✨ "Recommended" badges on top slots
   - 📊 Scores (0-100) for each slot
   - 📝 Reasons why slots are recommended

### Test 3: Check Capacity Dashboard
1. Go to admin dashboard
2. View capacity for today
3. You should see:
   - Overall utilization percentage
   - Per-dentist breakdowns
   - Alerts if anyone is near capacity

### Test 4: Try Rescheduling
1. Select an existing appointment
2. Click "Reschedule"
3. You should see 3 smart suggestions
4. Accept one and verify it updates

---

## 🔧 Step 5: Configure Settings (Optional)

### Customize Appointment Types

```sql
-- Add a new appointment type
INSERT INTO appointment_types (
  business_id,
  name,
  category,
  default_duration_minutes,
  buffer_time_after_minutes,
  color
) VALUES (
  'your-business-id',
  'Root Canal',
  'root_canal',
  90,
  20,
  '#DC2626'
);
```

### Adjust Capacity Settings

```sql
-- Update dentist capacity limits
UPDATE dentist_capacity_settings
SET
  max_appointments_per_day = 20,
  emergency_slots_per_day = 3,
  default_buffer_minutes = 10
WHERE dentist_id = 'your-dentist-id';
```

---

## 🔍 Step 6: Monitor & Learn

The system automatically learns from usage:

### Patient Preferences
- Automatically calculated when appointments are completed/cancelled
- Updates preferred times, days, reliability scores
- Run manually if needed:
  ```sql
  SELECT calculate_patient_preferences('patient-id', 'business-id');
  ```

### Check Preference Data
```sql
SELECT
  p.first_name,
  p.last_name,
  pp.preferred_time_of_day,
  pp.reliability_score,
  pp.no_show_rate
FROM patient_preferences pp
JOIN profiles p ON pp.patient_id = p.id;
```

### View Recommendation Performance
```sql
-- See how often patients pick recommended slots
SELECT
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE was_recommended = true) as picked_recommended,
  ROUND(
    COUNT(*) FILTER (WHERE was_recommended = true)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as recommendation_acceptance_rate
FROM slot_recommendations;
```

---

## 📊 Available Backend Functions

You can use these in your TypeScript code:

```typescript
import {
  getRecommendedSlots,
  checkDentistCapacity,
  getPatientPreferences,
  validateBufferTimes,
  findBestAvailableDentist
} from '@/lib/smartScheduling';

import {
  findRescheduleOptions,
  autoRescheduleAppointment,
  bulkRescheduleForDentist,
  acceptRescheduleSuggestion
} from '@/lib/autoRescheduling';

import {
  fetchDentistAvailabilityWithBuffers,
  isSlotAvailableWithBuffer
} from '@/lib/appointmentAvailability';
```

---

## 🎯 Success Criteria

After setup, you should be able to:
- ✅ See intelligent recommendations when booking
- ✅ View capacity metrics in admin dashboard
- ✅ Get smart reschedule suggestions
- ✅ Have buffer times enforced automatically
- ✅ See patient preferences being calculated

---

## ⚠️ Troubleshooting

### Issue: "appointment_types table already exists"
```sql
-- Check if it exists
SELECT COUNT(*) FROM appointment_types;
-- If empty, migration ran but data didn't populate
-- Re-run the INSERT statements from the migration
```

### Issue: "Function calculate_patient_preferences does not exist"
```sql
-- Verify functions were created
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%patient_preferences%';
```

### Issue: Components not rendering
```bash
# Ensure all dependencies are installed
npm install
# Restart dev server
npm run dev
```

### Issue: Business_id errors
```bash
# Make sure businesses table exists and has data
# The system requires business_id on dentists table
```

---

## 📚 Next Steps

1. ✅ Run the migration
2. ✅ Test the booking flow
3. ✅ Configure appointment types for your practice
4. ✅ Set capacity limits per dentist
5. ✅ Monitor the dashboard for patterns
6. 📈 Watch recommendations improve over time!

---

## 🆘 Need Help?

- Check the migration file: `supabase/migrations/20251105064008_add_smart_scheduling_system.sql`
- Review component source: `src/components/SmartAppointmentBooking.tsx`
- Backend logic: `src/lib/smartScheduling.ts`

---

**Your smart scheduling system is now ready to use!** 🎉
