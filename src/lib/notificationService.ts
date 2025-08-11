import { supabase } from '../integrations/supabase/client';
import { Notification, NotificationPreferences, NotificationTemplate } from '../types/common';

export class NotificationService {
  // Get all notifications for a user
  static async getNotifications(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }

    const rows = (data ?? []) as any[];
    // Ensure metadata is an object to satisfy Notification type
    return rows.map((row) => ({ ...row, metadata: (row.metadata && typeof row.metadata === 'object') ? row.metadata : {} })) as unknown as Notification[];
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw new Error('Failed to fetch unread count');
    }

    return data?.length || 0;
  }

// Mark notification as read
static async markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }

  return true;
}

// Mark all notifications as read
static async markAllAsRead(): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .select('id');

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }

  return data?.length || 0;
}

  // Create a new notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'system',
    category: Notification['category'] = 'info',
    actionUrl?: string,
    metadata?: Record<string, unknown>,
    expiresAt?: string
  ): Promise<string> {
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    type,
    category,
    title,
    message,
    action_url: actionUrl,
    metadata: (metadata as any) || null,
    expires_at: expiresAt || null,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  .select('id')
  .single();

if (error) {
  console.error('Error creating notification:', error);
  throw new Error('Failed to create notification');
}

return data.id;
  }

  // Create appointment reminder notification
  static async createAppointmentReminder(
    appointmentId: string,
    reminderType: '24h' | '2h' | '1h' = '24h'
  ): Promise<string> {
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'unknown',
    type: 'appointment',
    category: 'info',
    title: `Appointment Reminder (${reminderType})`,
    message: `Reminder for appointment ${appointmentId}`,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  .select('id')
  .single();

if (error) {
  console.error('Error creating appointment reminder:', error);
  throw new Error('Failed to create appointment reminder');
}

return data.id;
  }

  // Create prescription notification
static async createPrescriptionNotification(prescriptionId: string): Promise<string> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: 'unknown',
      type: 'prescription',
      category: 'info',
      title: 'New Prescription',
      message: `Prescription created (${prescriptionId})`,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating prescription notification:', error);
    throw new Error('Failed to create prescription notification');
  }

  return data.id;
}

  // Create treatment plan notification
  static async createTreatmentPlanNotification(
    treatmentPlanId: string,
    notificationType: 'created' | 'updated' | 'completed' = 'created'
  ): Promise<string> {
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'unknown',
    type: 'treatment_plan',
    category: 'info',
    title: `Treatment Plan ${notificationType}`,
    message: `Treatment plan update (${treatmentPlanId})`,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  .select('id')
  .single();

if (error) {
  console.error('Error creating treatment plan notification:', error);
  throw new Error('Failed to create treatment plan notification');
}

return data.id;
  }

  // Get notification preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    console.warn('Notification preferences not implemented, returning null');
    return null;
  }

  // Update notification preferences
static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    // Stubbed local preferences
    const defaultPrefs: NotificationPreferences = {
      id: `local-${userId}`,
      user_id: userId,
      email_enabled: true,
      sms_enabled: false,
      push_enabled: false,
      in_app_enabled: true,
      appointment_reminders: true,
      prescription_updates: true,
      treatment_plan_updates: true,
      emergency_alerts: true,
      system_notifications: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { ...defaultPrefs, ...preferences, updated_at: new Date().toISOString() } as NotificationPreferences;
  }

  // Get notification templates
static async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return [];
  }

  // Create notification from template
static async createNotificationFromTemplate(
    userId: string,
    templateKey: string,
    variables: Record<string, string> = {},
    actionUrl?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const title = templateKey;
    const message = Object.entries(variables).map(([k,v]) => `${k}: ${v}`).join(', ');
    return this.createNotification(userId, title, message, 'system', 'info' as any, actionUrl, metadata);
  }

  // Delete expired notifications
  static async deleteExpiredNotifications(): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    if (error) {
      console.error('Error deleting expired notifications:', error);
      throw new Error('Failed to delete expired notifications');
    }

    const rows = data ?? [];
    return rows.length;
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Unsubscribe from real-time notifications
  static unsubscribeFromNotifications(userId: string) {
    return supabase.channel(`notifications:${userId}`).unsubscribe();
  }
}