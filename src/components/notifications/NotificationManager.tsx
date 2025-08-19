import { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnhancedNotificationCenter } from './EnhancedNotificationCenter';
import { MobileNotificationOverlay } from './MobileNotificationOverlay';
import { SmartNotificationBanner, UrgentNotificationBanner } from './SmartNotificationBanner';
import { NotificationToastContainer, NotificationToast } from './NotificationToast';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';

interface NotificationManagerProps {
  userId: string;
  enableBanners?: boolean;
  enableToasts?: boolean;
  bannerPosition?: 'top' | 'bottom';
  maxBannerNotifications?: number;
  className?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationManager({
  userId,
  enableBanners = true,
  enableToasts = true,
  bannerPosition = 'top',
  maxBannerNotifications = 3,
  className
}: NotificationManagerProps) {
  const isMobile = useIsMobile();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bannerDismissals, setBannerDismissals] = useState<Set<string>>(new Set());

  const {
    notifications,
    unreadCount,
    error,
    markAsRead
  } = useNotifications(userId);

  // Filter notifications for banners (urgent and high priority)
  const bannerNotifications = useMemo(() => {
    return notifications
      .filter(n => 
        !n.is_read && 
        ['urgent', 'high'].includes(n.priority) && 
        !bannerDismissals.has(n.id)
      )
      .slice(0, maxBannerNotifications);
  }, [notifications, bannerDismissals, maxBannerNotifications]);

  // Handle banner dismissal
  const handleBannerDismiss = (notificationId: string) => {
    setBannerDismissals(prev => new Set([...prev, notificationId]));
    markAsRead(notificationId);
  };

  // Handle banner action
  const handleBannerAction = (notification: any) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Toast management
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Convert critical notifications to toasts
  useEffect(() => {
    if (!enableToasts) return;

    const criticalNotifications = notifications.filter(n => 
      !n.is_read && 
      n.priority === 'urgent' && 
      new Date(n.created_at).getTime() > Date.now() - 10000 // Last 10 seconds
    );

    criticalNotifications.forEach(notification => {
      addToast({
        type: 'error',
        title: notification.title,
        message: notification.message,
        duration: 0, // Don't auto-dismiss urgent notifications
        action: notification.action_url ? {
          label: notification.action_label || 'View',
          onClick: () => {
            markAsRead(notification.id);
            window.location.href = notification.action_url;
          }
        } : undefined
      });
    });
  }, [notifications, enableToasts, markAsRead]);

  // Show error toasts for system errors
  useEffect(() => {
    if (error && enableToasts) {
      addToast({
        type: 'error',
        title: 'Notification Error',
        message: error
      });
    }
  }, [error, enableToasts]);

  // Render mobile vs desktop notification center
  const NotificationCenter = () => {
    if (isMobile) {
      return (
        <MobileNotificationOverlay 
          userId={userId}
        />
      );
    }

    return (
      <EnhancedNotificationCenter 
        userId={userId}
        variant="popover"
        className={className}
      />
    );
  };

  return (
    <>
      {/* Main Notification Center */}
      <NotificationCenter />

      {/* Smart Banners for urgent notifications */}
      {enableBanners && bannerNotifications.length > 0 && (
        <SmartNotificationBanner
          notifications={bannerNotifications}
          onDismiss={handleBannerDismiss}
          onAction={handleBannerAction}
          maxVisible={maxBannerNotifications}
          position={bannerPosition}
          autoHide={false}
        />
      )}

      {/* Toast Notifications */}
      {enableToasts && toasts.length > 0 && (
        <NotificationToastContainer
          toasts={toasts}
          onDismiss={removeToast}
        />
      )}
    </>
  );
}

// Convenience hooks for common notification patterns
export const useNotificationManager = (userId: string) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess: (title: string, message?: string) => 
      showToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) => 
      showToast({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) => 
      showToast({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) => 
      showToast({ type: 'info', title, message })
  };
};