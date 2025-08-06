import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Calendar,
  CreditCard,
  Pill,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
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

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4 text-dental-primary" />;
      case 'prescription':
        return <Pill className="h-4 w-4 text-dental-secondary" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-dental-accent" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-dental-warning" />;
      case 'error':
        return <X className="h-4 w-4 text-dental-error" />;
      default:
        return <Info className="h-4 w-4 text-dental-info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-dental-error';
      case 'medium':
        return 'border-l-dental-warning';
      case 'low':
        return 'border-l-dental-info';
      default:
        return 'border-l-dental-muted';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      // If it's a Stripe URL, open in new tab
      if (notification.action_url.includes('stripe.com') || notification.action_url.includes('checkout')) {
        window.open(notification.action_url, '_blank');
      } else {
        // Internal navigation
        window.location.href = notification.action_url;
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      modernToast.success({
        title: 'All notifications marked as read',
        description: 'Your notification center is now clean!'
      });
    } catch (error) {
      modernToast.error({
        title: 'Failed to mark all as read',
        description: 'Please try again later'
      });
    }
  };

  if (error) {
    modernToast.error({
      title: 'Notification Error',
      description: error
    });
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-dental-error text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 max-h-[600px] shadow-elegant z-50 border-dental-primary/20">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-auto bg-dental-error">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
                <p className="text-sm text-dental-muted-foreground mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-dental-muted-foreground mb-3" />
                <p className="text-dental-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-l-4 cursor-pointer transition-all hover:bg-dental-muted/30 ${
                        getPriorityColor(notification.priority)
                      } ${!notification.is_read ? 'bg-dental-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-semibold ${
                              !notification.is_read ? 'text-dental-foreground' : 'text-dental-muted-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 ml-2">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-dental-primary rounded-full" />
                              )}
                              <span className="text-xs text-dental-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.is_read ? 'text-dental-foreground' : 'text-dental-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.action_label && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 text-xs h-7"
                            >
                              {notification.action_label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}