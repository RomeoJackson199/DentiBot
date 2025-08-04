# Notification System Documentation

## Overview

The notification system provides real-time notifications for patients and dentists in the dental application. It supports various types of notifications including appointment reminders, prescription updates, treatment plan changes, and emergency alerts.

## Features

### For Patients
- **Real-time notifications** with unread count badge
- **Notification preferences** (email, SMS, push, in-app)
- **Different notification categories** (info, success, warning, error, urgent)
- **Click to mark as read** functionality
- **Notification history** with search and filtering

### For Dentists
- **Send notifications to specific patients**
- **Different notification types** (appointment, prescription, treatment plan, follow-up, emergency, general)
- **Priority levels** for notifications
- **Template-based notifications** for common scenarios

## Database Schema

### Tables

#### `notifications`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (Text)
- `message` (Text)
- `type` (Text: appointment, prescription, reminder, emergency, system, treatment_plan, follow_up)
- `category` (Text: info, warning, success, error, urgent)
- `is_read` (Boolean, default: false)
- `action_url` (Text, optional)
- `metadata` (JSONB, optional)
- `expires_at` (Timestamp, optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `notification_preferences`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `email_enabled` (Boolean, default: true)
- `sms_enabled` (Boolean, default: true)
- `push_enabled` (Boolean, default: true)
- `in_app_enabled` (Boolean, default: true)
- `appointment_reminders` (Boolean, default: true)
- `prescription_updates` (Boolean, default: true)
- `treatment_plan_updates` (Boolean, default: true)
- `emergency_alerts` (Boolean, default: true)
- `system_notifications` (Boolean, default: true)
- `quiet_hours_start` (Time, default: 22:00)
- `quiet_hours_end` (Time, default: 08:00)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `notification_templates`
- `id` (UUID, Primary Key)
- `template_key` (Text, Unique)
- `title_template` (Text)
- `message_template` (Text)
- `type` (Text)
- `category` (Text)
- `is_active` (Boolean, default: true)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Components

### NotificationButton
The main notification component that displays:
- Notification bell icon with unread count badge
- Dropdown with recent notifications
- Mark as read functionality
- Notification preferences dialog

### DentistNotificationSender
Component for dentists to send notifications to patients:
- Patient selection with search
- Notification type selection
- Priority level selection
- Custom title and message
- Template-based notifications

### NotificationTest
Test component to verify notification functionality:
- Test different notification types
- Test notification categories
- Test preferences management
- Real-time notification testing

## Services

### NotificationService
Core service for notification operations:
- `getNotifications(userId, limit, offset)` - Fetch notifications
- `getUnreadCount(userId)` - Get unread count
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read
- `createNotification(...)` - Create new notification
- `createAppointmentReminder(appointmentId, type)` - Create appointment reminder
- `createPrescriptionNotification(prescriptionId)` - Create prescription notification
- `createTreatmentPlanNotification(treatmentPlanId, action)` - Create treatment plan notification
- `getNotificationPreferences(userId)` - Get user preferences
- `updateNotificationPreferences(userId, updates)` - Update preferences
- `subscribeToNotifications(userId, callback)` - Real-time subscription

### NotificationTriggers
Automatic notification triggers:
- `onPrescriptionCreated(prescriptionId)` - When new prescription is created
- `onTreatmentPlanUpdated(treatmentPlanId, action)` - When treatment plan changes
- `scheduleAppointmentReminders(appointmentId)` - Schedule appointment reminders
- `onAppointmentConfirmed(appointmentId)` - When appointment is confirmed
- `onAppointmentCancelled(appointmentId)` - When appointment is cancelled
- `onPrescriptionExpiring(prescriptionId)` - When prescription is expiring
- `onEmergencyTriageCompleted(userId, urgencyLevel)` - When emergency triage completes
- `onFollowUpReminder(userId, type, dueDate)` - Follow-up reminders
- `onSystemMaintenance(date, duration, description)` - System maintenance notifications

## Hooks

### useNotifications
Custom hook for managing notifications:
```typescript
const {
  notifications,
  unreadCount,
  preferences,
  isLoading,
  error,
  markAsRead,
  markAllAsRead,
  updatePreferences,
  refreshNotifications
} = useNotifications(userId);
```

## Usage Examples

### Creating a Basic Notification
```typescript
import { NotificationService } from '../lib/notificationService';

await NotificationService.createNotification(
  userId,
  'Appointment Confirmed',
  'Your appointment has been confirmed for tomorrow.',
  'appointment',
  'success',
  '/appointments/123',
  { appointment_id: '123' }
);
```

### Sending Appointment Reminder
```typescript
import { NotificationService } from '../lib/notificationService';

await NotificationService.createAppointmentReminder(appointmentId, '24h');
```

### Using Notification Triggers
```typescript
import { NotificationTriggers } from '../lib/notificationTriggers';

// When prescription is created
await NotificationTriggers.onPrescriptionCreated(prescriptionId);

// When treatment plan is updated
await NotificationTriggers.onTreatmentPlanUpdated(treatmentPlanId, 'updated');

// When emergency triage completes
await NotificationTriggers.onEmergencyTriageCompleted(userId, 'medium');
```

### Using the Notification Button Component
```typescript
import { NotificationButton } from '../components/NotificationButton';

<NotificationButton user={user} />
```

### Using the Dentist Notification Sender
```typescript
import { DentistNotificationSender } from '../components/DentistNotificationSender';

<DentistNotificationSender dentist={dentist} />
```

## Real-time Features

The notification system supports real-time updates using Supabase's real-time subscriptions:

1. **Automatic Updates**: Notifications appear instantly when created
2. **Unread Count**: Badge updates automatically
3. **Live Preferences**: Changes to preferences are reflected immediately

## Notification Types

### For Patients
- **Appointment**: Reminders, confirmations, cancellations
- **Prescription**: New prescriptions, updates, expiring reminders
- **Treatment Plan**: Plan creation, updates, completion
- **Emergency**: Urgent alerts, triage results
- **System**: Maintenance, general announcements
- **Follow-up**: Reminders for follow-up appointments

### For Dentists
- **Appointment Reminder**: Send appointment reminders to patients
- **Prescription Update**: Notify about prescription changes
- **Treatment Plan**: Update patients about treatment plans
- **Follow-up**: Schedule follow-up reminders
- **Emergency Alert**: Send urgent medical information
- **General Message**: Send custom messages to patients

## Notification Categories

- **Info**: General information (blue)
- **Success**: Positive outcomes (green)
- **Warning**: Cautionary messages (yellow)
- **Error**: Error messages (red)
- **Urgent**: Critical alerts (red, bold)

## Security

- **Row Level Security (RLS)**: Users can only see their own notifications
- **Authentication Required**: All notification operations require authentication
- **Data Validation**: Input validation for all notification data
- **Rate Limiting**: Protection against notification spam

## Testing

Use the `NotificationTest` component to test all notification functionality:

1. Navigate to the Patient Dashboard
2. Go to the "Test" tab
3. Use the test buttons to verify different notification types
4. Check the notification button to see real-time updates

## Migration

To set up the notification system, run the migration:

```bash
supabase db push
```

This will create all necessary tables, functions, and policies.

## Future Enhancements

- **Push Notifications**: Browser push notifications
- **Email Integration**: Email notifications via SMTP
- **SMS Integration**: Text message notifications
- **Advanced Filtering**: Filter notifications by type, date, etc.
- **Bulk Operations**: Mark multiple notifications as read
- **Notification Analytics**: Track notification engagement
- **Custom Templates**: User-defined notification templates