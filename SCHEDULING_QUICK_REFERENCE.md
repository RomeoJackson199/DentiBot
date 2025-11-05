# DentiBot Scheduling System - Quick Reference Guide

## Documents Generated

1. **SCHEDULING_SYSTEM_EXECUTIVE_SUMMARY.md** (213 lines, 7.1KB)
   - High-level overview for decision makers
   - Quick stats and architecture overview
   - Key gaps and opportunities
   - Recommendations for next steps

2. **SCHEDULING_SYSTEM_ANALYSIS.md** (475 lines, 16KB)
   - Comprehensive technical deep-dive
   - Complete database schema documentation
   - Detailed component architecture
   - Limitations and improvement opportunities
   - Implementation notes and security considerations

## Key Findings at a Glance

### What Currently Works

| Feature | Status | Details |
|---------|--------|---------|
| Appointment Booking | Complete | Full booking flow with validation |
| Cancellation/Rescheduling | Complete | Dialog-based with slot recheck |
| Working Hours Management | Complete | Per-dentist, per-day configuration |
| Vacation Management | Complete | Multi-day time-off with types |
| Notifications | Complete | Email + SMS + In-app reminders |
| Google Calendar Sync | Complete | One-way sync to Google Calendar |
| Real-time Updates | Complete | Supabase subscriptions |
| Multi-view Calendar | Complete | Day, Week, Month, List views |
| Appointment States | Complete | Pending, Confirmed, Completed, Cancelled |
| Treatment Tracking | Complete | NIHDI codes and billing |

### Critical Gaps for Smart Scheduling

| Capability | Gap | Impact |
|-----------|-----|--------|
| AI Recommendations | None | Hard to suggest optimal times |
| Predictive Analytics | None | No no-show or pattern detection |
| Service Types | None | All appointments treated equally |
| Team Scheduling | None | Single dentist per appointment only |
| Resource Allocation | None | No equipment/room tracking |
| Buffer Management | None | No time between appointments |
| Workload Balancing | None | Manual distribution only |
| Financial Optimization | None | No revenue-based prioritization |

## Core Business Objects

### Appointment
```typescript
{
  id: UUID
  patient_id: UUID
  dentist_id: UUID
  appointment_date: TIMESTAMP
  duration_minutes: INT (default 60)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  reason: string
  notes: string
  business_id: UUID
}
```

### Dentist Availability
```typescript
{
  dentist_id: UUID
  day_of_week: 0-6 (0=Sunday)
  start_time: TIME
  end_time: TIME
  break_start_time?: TIME
  break_end_time?: TIME
  is_available: BOOLEAN
  business_id: UUID
}
```

### Appointment Slot
```typescript
{
  dentist_id: UUID
  slot_date: DATE
  slot_time: TIME (30-min intervals)
  is_available: BOOLEAN
  appointment_id?: UUID
  emergency_only?: BOOLEAN
}
```

## Critical Code Paths

### Availability Calculation
```
fetchDentistAvailability(dentistId, date)
├─ 1. Check if on vacation (dentist_vacation_days)
├─ 2. Check if working day (dentist_availability.is_available)
├─ 3. Load pre-generated appointment_slots
├─ 4. Fall back to computed slots if needed
└─ Return TimeSlot[] with availability status
```

### Appointment Creation
```
createAppointmentWithNotification(appointmentData)
├─ 1. Insert into appointments table
├─ 2. Call book_appointment_slot() DB function
├─ 3. Async: Sync to Google Calendar
├─ 4. Async: Send confirmation email
├─ 5. Async: Schedule reminders (24h, 2h)
└─ Return created Appointment object
```

### Notification Flow
```
Appointment Event (created/updated/cancelled)
└─ NotificationTriggers class
   ├─ onAppointmentConfirmed() → Email confirmation
   ├─ onAppointmentCancelled() → Cancellation notice
   ├─ scheduleAppointmentReminders() → 24h & 2h reminders
   └─ All async, non-blocking
```

## Key Hooks to Understand

### useAppointments()
```typescript
useAppointments({
  role: 'patient' | 'dentist',
  userId?: string,
  dentistId?: string,
  patientId?: string,
  status?: string[],
  fromDate?: Date,
  toDate?: Date,
  autoRefresh?: boolean
})

Returns: {
  appointments: Appointment[],
  counts: { today, upcoming, completed, total },
  loading: boolean,
  error: string | null,
  refetch: () => Promise<void>,
  updateAppointment: (id, updates) => Promise<void>
}
```

## Database Functions to Know

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `generate_daily_slots()` | Create 30-min slots for a date | dentist_id, date | void |
| `book_appointment_slot()` | Mark slot as booked | dentist_id, date, time, appointment_id | boolean |
| `release_appointment_slot()` | Mark slot as available | appointment_id | boolean |
| `get_patient_context_for_ai()` | Fetch all patient data | patient_id | JSONB |

## File Organization Pattern

```
/src/
├── hooks/
│   └── useAppointments.tsx ...................... [Main hook]
├── lib/
│   ├── appointmentAvailability.ts .............. [Calculation logic]
│   ├── appointmentUtils.ts ..................... [Utilities]
│   └── notificationTriggers.ts ................. [Event handlers]
├── pages/
│   ├── DentistAdminSchedule.tsx ................ [Admin page]
│   ├── Schedule.tsx ............................ [View page]
│   └── BookAppointment.tsx ..................... [Booking page]
├── components/
│   ├── enhanced/
│   │   ├── EnhancedScheduleManager.tsx ........ [Main manager]
│   │   └── EnhancedAvailabilitySettings.tsx ... [Config]
│   ├── appointments/
│   │   ├── EnhancedAppointmentManager.tsx ..... [Manager]
│   │   ├── AppointmentCalendarView.tsx ........ [Calendar]
│   │   └── AppointmentEditDialog.tsx .......... [Edit form]
│   ├── AppointmentBooking.tsx .................. [Booking form]
│   └── RescheduleDialog.tsx .................... [Reschedule]
└── integrations/
    └── supabase/ .............................. [DB client]
```

## Next Steps for Smart Scheduling

### Phase 1: Foundation (1-2 weeks)
- [ ] Add appointment service types
- [ ] Create service type duration defaults
- [ ] Add patient preference tracking table
- [ ] Implement preference learning hook

### Phase 2: Intelligence (2-3 weeks)
- [ ] Build slot recommendation algorithm
- [ ] Add appointment type filtering to availability
- [ ] Implement workload balancing
- [ ] Create overbooking prevention

### Phase 3: Advanced (3-4 weeks)
- [ ] Predictive no-show detection
- [ ] Auto-rescheduling on conflicts
- [ ] Revenue optimization
- [ ] Advanced analytics dashboard

## Important Constraints & Patterns

1. **Multi-tenancy via business_id** - Always filter by business_id in queries
2. **RLS Enforcement** - Row-level security policies are active
3. **Timezone Handling** - Use `clinicTimeToUtc()` and `utcToClinicTime()` functions
4. **Async First** - Google Calendar and email don't block appointment creation
5. **Slot Generation** - Always call generate_daily_slots() before fetching slots
6. **Error Handling** - External integrations fail gracefully

## Quick Troubleshooting

| Issue | Likely Cause | Solution |
|-------|------------|----------|
| No slots available | Dentist not working that day | Check dentist_availability.is_available |
| Slots not showing | Slots not generated yet | Call generate_daily_slots() RPC |
| Slot marked as booked but no appointment | Data inconsistency | Check appointment_slots vs appointments |
| Vacation dates ignored | Approval status wrong | Verify is_approved=true |
| Email not sent | Function invocation failed | Check logs, verify email function |
| Calendar out of sync | One-way sync only | Manually update in app |

---

For detailed information, see:
- `SCHEDULING_SYSTEM_ANALYSIS.md` - Full technical deep-dive
- `SCHEDULING_SYSTEM_EXECUTIVE_SUMMARY.md` - Strategic overview
