import { useState, useEffect, useMemo } from 'react';
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
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const isAlert = (n: any) => {
    const type = (n?.type || '').toLowerCase();
    const priority = (n?.priority || '').toLowerCase();
    const category = (n?.category || '').toLowerCase();
    return type === 'warning' || type === 'error' || priority === 'high' || category === 'urgent' || category === 'error';
  };

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n: any) => {
      if (activeFilter === 'unread' && n.is_read) return false;
      if (activeFilter === 'alerts' && !isAlert(n)) return false;
      if (!q) return true;
      const title = (n.title || '').toLowerCase();
      const msg = (n.message || '').toLowerCase();
      return title.includes(q) || msg.includes(q);
    });
  }, [notifications, activeFilter, searchQuery]);

  const groupByDateBuckets = useMemo(() => {
    const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    for (const n of filteredNotifications) {
      const ts = new Date(n.created_at).getTime();
      if (ts >= startOfToday) groups['Today'].push(n);
      else if (ts >= startOfYesterday) groups['Yesterday'].push(n);
      else groups['Earlier'].push(n);
    }
    return groups;
  }, [filteredNotifications]);

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
        <Card className="absolute top-12 right-0 w-[90vw] sm:w-[480px] max-h-[640px] shadow-elegant z-50 border-dental-primary/20">
          <CardHeader className="pb-3 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 bg-dental-error">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => refreshNotifications()}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-dental-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="pl-8 h-8"
                />
              </div>
              <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs px-2">Unread</TabsTrigger>
                  <TabsTrigger value="alerts" className="text-xs px-2">Alerts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-dental-muted-foreground mb-3" />
                <p className="text-dental-muted-foreground">No {searchQuery ? 'matching ' : ''}notifications {searchQuery ? 'found' : 'yet'}</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[480px]">
                <div className="space-y-3">
                  {(['Today', 'Yesterday', 'Earlier'] as const).map((section) => (
                    groupByDateBuckets[section].length > 0 ? (
                      <div key={section}>
                        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                          <div className="px-4 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-dental-muted-foreground">{section}</div>
                          </div>
                          <Separator />
                        </div>
                        <div className="space-y-1">
                          {groupByDateBuckets[section].map((notification: any) => (
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
                      </div>
                    ) : null
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