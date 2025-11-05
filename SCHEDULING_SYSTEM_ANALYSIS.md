# DentiBot Scheduling System - Comprehensive Overview

## 1. CURRENT SCHEDULING FUNCTIONALITY

### 1.1 Existing Features
- **Appointment Creation**: Patients can book appointments with dentists
- **Appointment Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Status Tracking**: Appointments have statuses (pending, confirmed, completed, cancelled)
- **Urgency Levels**: High, Medium, Low priority classifications
- **Appointment Outcomes**: Track treatment outcomes and procedures performed
- **Reschedule Support**: Patients can reschedule appointments via RescheduleDialog
- **Cancellation**: Full appointment cancellation with notification system
- **Email Notifications**: Confirmation emails sent to patients
- **Google Calendar Sync**: Automatic sync of appointments to Google Calendar
- **Real-time Updates**: Supabase real-time subscriptions for live appointment changes
- **SMS/Twilio Support**: SMS notifications for appointment reminders and updates
- **Appointment Reminders**: Automated 24-hour and 2-hour pre-appointment reminders
- **Multi-view Calendar**: Day, Week, Month, and List views for appointment visualization
- **Appointment Filters**: Filter by status, date range, type, and patient
- **Duration Tracking**: Configurable appointment duration (default 30-60 minutes)

### 1.2 Availability Management
- **Working Hours**: Dentist-level working hours per day of week
- **Break Times**: Lunch breaks and other scheduled breaks
- **Vacation Management**: Multi-day vacation/sick leave tracking
  - Support for "vacation", "sick", and "personal" leave types
  - Approval workflow capability
  - Impact on availability calculations
- **Appointment Slots**: Pre-generated 30-minute time slots
- **Slot Availability**: Individual slot marking (available/booked)
- **Emergency-Only Slots**: Special slots reserved for emergencies

### 1.3 Database Schema

#### Core Tables:
```
appointments
├── id (UUID)
├── patient_id (FK → profiles)
├── dentist_id (FK → dentists)
├── appointment_date (TIMESTAMP)
├── duration_minutes (INT, default 60)
├── status (ENUM: pending, confirmed, completed, cancelled)
├── urgency (ENUM: low, medium, high, emergency)
├── reason (TEXT)
├── notes (TEXT)
├── business_id (FK → businesses)
├── created_at / updated_at

appointment_slots
├── id (UUID)
├── dentist_id (FK)
├── slot_date (DATE)
├── slot_time (TIME)
├── is_available (BOOLEAN)
├── appointment_id (FK)
├── emergency_only (BOOLEAN)
├── created_at / updated_at

dentist_availability
├── id (UUID)
├── dentist_id (FK)
├── day_of_week (INT: 0-6)
├── start_time (TIME)
├── end_time (TIME)
├── break_start_time (TIME)
├── break_end_time (TIME)
├── is_available (BOOLEAN)
├── business_id (FK)
├── created_at / updated_at

dentist_vacation_days
├── id (UUID)
├── dentist_id (FK)
├── start_date (DATE)
├── end_date (DATE)
├── vacation_type (TEXT: vacation, sick, personal)
├── reason (TEXT)
├── is_approved (BOOLEAN)
├── business_id (FK)
├── created_at / updated_at

appointment_outcomes
├── appointment_id (FK)
├── outcome (ENUM: successful, partial, cancelled, complication)
├── notes (TEXT)
├── pain_score (INT 0-10)
├── anesthesia_used (BOOLEAN)
├── created_by (FK → dentists)

appointment_treatments
├── appointment_id (FK)
├── code (TEXT - NIHDI code)
├── description (TEXT)
├── quantity (INT)
├── tooth_ref (TEXT)
├── tariff, mutuality_share, patient_share (NUMERIC)

calendar_events
├── appointment_id (FK)
├── title, description, start/end_datetime
├── event_type (appointment, blocked_time, break, personal)
├── is_recurring, recurrence_pattern (JSONB)

urgency_assessments
├── appointment_id (FK)
├── pain_level (INT 0-10)
├── has_bleeding, has_swelling (BOOLEAN)
├── duration_symptoms (TEXT)
├── assessment_score, calculated_urgency
```

### 1.4 Key Database Functions/Procedures

```sql
generate_daily_slots(p_dentist_id, p_date)
  - Generates 30-min slots from 9:00 AM to 5:00 PM
  - Uses INSERT ... ON CONFLICT for idempotency

book_appointment_slot(p_dentist_id, p_slot_date, p_slot_time, p_appointment_id)
  - Marks a slot as booked
  - Atomically updates availability status
  
release_appointment_slot(p_appointment_id)
  - Releases a booked slot when appointment is cancelled
  - Sets is_available back to true
```

## 2. ARCHITECTURE & DATA FLOW

### 2.1 Appointment Booking Flow
```
Patient Input
    ↓
AppointmentBooking Component
    ↓
Select Dentist → Select Date → Load Available Slots
    ↓
fetchDentistAvailability()
    ├─ Check dentist_availability (working hours)
    ├─ Check dentist_vacation_days
    ├─ Check existing appointments
    ├─ Load appointment_slots
    └─ Return filtered TimeSlot[]
    ↓
Select Time Slot & Enter Details
    ↓
createAppointmentWithNotification()
    ├─ Insert into appointments
    ├─ Mark slot as booked
    ├─ Sync to Google Calendar (async)
    ├─ Send confirmation email (async)
    └─ Schedule reminders (24h, 2h)
```

### 2.2 Availability Calculation Priority
1. **Priority 1**: Check dentist_vacation_days (if approved, day is blocked)
2. **Priority 2**: Check dentist_availability (working day/hours)
3. **Priority 3**: Use appointment_slots if they exist
4. **Priority 4**: Fall back to calculated slots from availability + appointments

### 2.3 Component Architecture

#### Frontend Components
```
Schedule Management:
├── DentistAdminSchedule (page) → EnhancedAvailabilitySettings
├── Schedule (page) → Schedule display with filtering
├── EnhancedScheduleManager → Day/Week/Month calendar views
│   ├── AppointmentCalendarView
│   ├── AppointmentListView
│   ├── AppointmentFilters
│   └── AppointmentStats

Appointment Booking:
├── AppointmentBooking
├── AppointmentBookingWithAuth
├── EnhancedAppointmentBooking
├── SimpleAppointmentBooking
└── BookingFlowTest

Appointment Management:
├── EnhancedAppointmentManager (main manager component)
├── AppointmentManager
├── AppointmentsList
├── PatientAppointments
├── RealAppointmentsList
├── UnifiedAppointments

Appointment Details:
├── AppointmentDetailsDialog
├── AppointmentEditDialog
├── AppointmentCompletionDialog
├── RescheduleDialog
├── AppointmentDetailsDialogSidebar
├── NextAppointmentWidget

Utilities:
├── AppointmentActions (reschedule, cancel, complete)
├── AppointmentCalendar
├── AppointmentCard
├── AppointmentList
└── AppointmentStats
```

#### Key Hooks
- `useAppointments()` - Fetch and manage appointments with filtering
  - Auto-refresh capability (30-second interval)
  - Real-time subscription support
  - Batch operations (update, counts calculation)
  
- `useCurrentDentist()` - Get current logged-in dentist info
- `useGoogleCalendarSync()` - Google Calendar integration
- `useLanguage()` - Multi-language support for scheduling UI

### 2.4 Notification Flow
```
Appointment Event
    ↓
NotificationTriggers class:
├── onAppointmentConfirmed() → Send email confirmation
├── onAppointmentCancelled() → Send cancellation notification
├── scheduleAppointmentReminders() → Schedule 24h & 2h reminders
├── onPrescriptionCreated() → Notify about prescriptions
└── [Other triggers...]
    ↓
NotificationService
    ├─ Create internal notification records
    ├─ Send emails via send-email-notification function
    ├─ Send SMS via Twilio (sms_notifications table)
    └─ Store notification metadata
```

## 3. FILES INVOLVED IN SCHEDULING

### Database/Schema
- `/supabase/migrations/20250709130708*.sql` - Initial schema with appointments
- `/supabase/migrations/20250710064746*.sql` - Appointment slots system
- `/supabase/migrations/20250710083424*.sql` - Dentist availability & calendar events
- `/supabase/migrations/20250803085540*.sql` - Vacation days & SMS notifications
- `/supabase/migrations/20250815000000*.sql` - Appointment outcomes and treatments
- `/supabase/migrations/20251022204036*.sql` - Recent schema enhancements

### Core Logic
- `/src/hooks/useAppointments.tsx` - Main appointment hook
- `/src/lib/appointmentAvailability.ts` - Availability calculation logic
- `/src/lib/appointmentUtils.ts` - Status/urgency/formatting utilities
- `/src/lib/notificationTriggers.ts` - Notification trigger logic
- `/src/lib/businessScopedSupabase.ts` - Multi-tenant business scoping

### Pages
- `/src/pages/DentistAdminSchedule.tsx` - Schedule admin page
- `/src/pages/Schedule.tsx` - Schedule display page
- `/src/pages/BookAppointment.tsx` - Public booking page
- `/src/pages/DentistAppointmentsManagement.tsx` - Dentist management
- `/src/pages/PatientAppointmentsPage.tsx` - Patient appointments view

### Components
- `/src/components/enhanced/EnhancedScheduleManager.tsx` - Main schedule manager
- `/src/components/enhanced/EnhancedAvailabilitySettings.tsx` - Availability config
- `/src/components/AppointmentBooking.tsx` - Booking form
- `/src/components/RescheduleDialog.tsx` - Reschedule functionality
- `/src/components/appointments/EnhancedAppointmentManager.tsx` - Manager component
- `/src/components/appointments/AppointmentCalendarView.tsx` - Calendar view
- `/src/components/appointments/AppointmentEditDialog.tsx` - Edit dialog
- `/src/components/appointments/AppointmentCompletionDialog.tsx` - Completion flow

## 4. LIMITATIONS & AREAS FOR IMPROVEMENT

### 4.1 Current Limitations

**Scheduling Intelligence:**
- No AI-driven appointment suggestions
- No automatic optimal slot recommendations
- Manual slot generation (every 30 minutes fixed)
- No dynamic slot duration adjustments based on appointment type
- No predictive appointment time estimation

**Conflict Management:**
- Basic conflict detection (existing appointments only)
- No advanced conflict resolution
- No automatic rebooking on cancellation
- No double-booking prevention at DB level

**Capacity Planning:**
- No overbooking/overallocation prevention
- No dentist utilization tracking
- No demand forecasting
- No load balancing across dentists
- No service time variance consideration

**Availability Features:**
- Static working hours (no flexible scheduling)
- No partial day availability
- No buffer time between appointments
- No travel time considerations
- Manual vacation management (no auto-updates)
- No recurring availability patterns

**Patient Experience:**
- No appointment preference learning
- No intelligent rebooking suggestions
- No wait time predictions
- No real-time availability updates to UI
- No appointment type-based recommendations

**Appointment Management:**
- No drag-and-drop rescheduling
- No bulk operations (cancel multiple, etc.)
- No appointment series/recurring appointments
- No resource allocation (room, equipment)
- No staff assignment optimization
- No appointment grouping by type/urgency

**Reporting & Analytics:**
- No scheduling efficiency metrics
- No utilization analysis
- No revenue optimization analytics
- No no-show prediction
- No gap analysis (unused slots)

**Integration Limitations:**
- Google Calendar sync is one-way (Google → App)
- No bidirectional calendar sync
- No integration with other calendar systems (Outlook, iCal)
- No external scheduling widgets (embed booking)

### 4.2 Business Logic Gaps

1. **No Appointment Type Classification**
   - All appointments treated equally
   - No service-specific duration defaults
   - No equipment/resource requirements

2. **No Team/Staff Scheduling**
   - Only single dentist per appointment
   - No assistant/hygienist scheduling
   - No resource constraints

3. **No Appointment Dependencies**
   - Follow-up appointments not linked
   - Treatment plans not synchronized
   - No prerequisite appointment checks

4. **No Smart Rescheduling**
   - Manual reschedule only
   - No automatic rebooking when dentist cancels
   - No conflict-aware reschedule suggestions

5. **No Buffer Management**
   - No pre/post-appointment buffers
   - No cleaning/setup time allocation
   - No transition time between appointments

6. **No Availability Constraints**
   - No per-patient availability windows
   - No per-service availability restrictions
   - No dynamic availability based on patient history

### 4.3 Data Quality Issues

1. **No Validation Rules**
   - Can book appointments in the past
   - No minimum advance booking time
   - No maximum advance booking limit
   - No cancellation deadline enforcement

2. **No Audit Trail**
   - Limited change history
   - No who/when/why tracking for changes
   - No soft deletes for audit purposes

3. **No Consistency Checks**
   - appointment table and appointment_slots can be out of sync
   - No referential integrity constraints in all cases
   - dentist_vacation_days business_id not required

## 5. OPPORTUNITIES FOR SMART SCHEDULING SYSTEM

### High Priority (Core Functionality)
1. **Intelligent Time Slot Recommendations**
   - Analyze patient preferences and history
   - Suggest optimal slots based on:
     * Dentist expertise/specialization
     * Appointment type requirements
     * Patient availability patterns
     * Historical no-show times

2. **Automatic Conflict Resolution**
   - Double-booking prevention
   - Automatic rebooking suggestions on dentist cancellation
   - Resource allocation optimization

3. **Appointment Duration Intelligence**
   - Learn from actual vs. scheduled duration
   - Dynamically adjust slot requirements
   - Type-based duration defaults
   - Buffer time for specific procedures

4. **Capacity Management**
   - Predictive overbooking detection
   - Dentist workload balancing
   - Emergency slot reservation

### Medium Priority (User Experience)
5. **Smart Rescheduling**
   - AI-powered rebooking suggestions
   - One-click accept best options
   - Automatic conflict avoidance

6. **Predictive Analytics**
   - No-show prediction
   - Optimal reminder timing
   - Cancellation risk scoring

7. **Patient Preference Learning**
   - Preferred time windows
   - Preferred dentist
   - Preferred appointment type
   - Optimal notification timing

8. **Resource Optimization**
   - Equipment/room allocation
   - Staff assignment
   - Multi-location scheduling
   - Hygienist/assistant coordination

### Lower Priority (Advanced Features)
9. **Advanced Integrations**
   - Bidirectional calendar sync
   - Outlook/iCal support
   - Embedded booking widgets
   - CRM integration

10. **Financial Optimization**
    - Revenue-based appointment priority
    - Profit margin considerations
    - VIP patient preferential treatment
    - Upsell opportunity identification

11. **Workflow Optimization**
    - Queue management
    - Wait time minimization
    - Treatment plan sequencing
    - Recall/prevention scheduling

## 6. IMPLEMENTATION NOTES

### Technology Stack
- **Frontend**: React + TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (WebSockets)
- **Calendar**: Supabase functions → Google Calendar API
- **Notifications**: Email + SMS (Twilio)
- **State Management**: React hooks + Zustand-like patterns

### Key Patterns Used
- Business-scoped data (business_id filtering)
- Row-Level Security (RLS) for multi-tenant isolation
- Real-time subscriptions for live updates
- Async function invocations for integrations
- Timezone-aware date handling
- Soft error handling (don't fail booking if external sync fails)

### Performance Considerations
- Pagination needed for appointment lists
- Index usage on appointment_date, dentist_id, patient_id
- Parallel RPC calls for availability calculation
- Real-time updates can create excessive database connections

### Security
- RLS policies enforce user access control
- Business-scoped queries ensure data isolation
- Sensitive operations via database functions
- SMS notifications have comprehensive audit trail
