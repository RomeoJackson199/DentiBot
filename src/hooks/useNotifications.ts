import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationPreferences } from '../types/common';
import { NotificationService } from '../lib/notificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (userId: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications and preferences
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [notificationsData, unreadCountData, preferencesData] = await Promise.all([
        NotificationService.getNotifications(userId, 50),
        NotificationService.getUnreadCount(userId),
        NotificationService.getNotificationPreferences(userId)
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
      setPreferences(preferencesData);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      const updatedPrefs = await NotificationService.updateNotificationPreferences(userId, updates);
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
    }
  }, [userId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const subscription = NotificationService.subscribeToNotifications(userId, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
      if (!newNotification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      NotificationService.unsubscribeFromNotifications(userId);
    };
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refreshNotifications
  };
};