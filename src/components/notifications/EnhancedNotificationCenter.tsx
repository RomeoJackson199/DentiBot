import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  Search,
  Settings,
  Filter,
  Archive,
  Star,
  Clock,
  BellRing,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Remove unused popover import
import { cn } from '@/lib/utils';

interface EnhancedNotificationCenterProps {
  userId: string;
  variant?: 'popover' | 'sidebar' | 'modal';
  className?: string;
}

type FilterType = 'all' | 'unread' | 'urgent' | 'appointments' | 'payments' | 'system';
type ViewMode = 'grouped' | 'chronological';

export function EnhancedNotificationCenter({ 
  userId, 
  variant = 'popover',
  className 
}: EnhancedNotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Enhanced notification icon with better styling
  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = cn(
      "h-4 w-4 transition-colors duration-200",
      priority === 'high' && "text-red-500",
      priority === 'normal' && "text-orange-500", 
      priority === 'medium' && "text-orange-500", // Backward compatibility
      priority === 'low' && "text-blue-500"
    );

    switch (type) {
      case 'appointment':
        return <Calendar className={iconClass} />;
      case 'prescription':
        return <Pill className={cn(iconClass, "text-green-500")} />;
      case 'payment':
        return <CreditCard className={cn(iconClass, "text-purple-500")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
      case 'error':
        return <X className={cn(iconClass, "text-red-500")} />;
      case 'success':
        return <Check className={cn(iconClass, "text-green-500")} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  // Enhanced priority styling
  const getPriorityStyles = (priority: string, isRead: boolean) => {
    const baseClasses = "transition-all duration-300 hover:shadow-md";
    
    if (priority === 'high') {
      return cn(
        baseClasses,
        "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent",
        !isRead && "from-red-100/70 to-red-50/30 shadow-red-100"
      );
    }
    
    if (priority === 'normal' || priority === 'medium') {
      return cn(
        baseClasses,
        "border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50/50 to-transparent",
        !isRead && "from-orange-100/70 to-orange-50/30 shadow-orange-100"
      );
    }
    
    return cn(
      baseClasses,
      "border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-transparent",
      !isRead && "from-blue-100/70 to-blue-50/30 shadow-blue-100"
    );
  };

  // Smart filtering with enhanced logic
  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return notifications.filter((n: any) => {
      // Filter by type
      if (activeFilter === 'unread' && n.is_read) return false;
      if (activeFilter === 'urgent' && n.priority !== 'high') return false;
      if (activeFilter === 'appointments' && n.type !== 'appointment') return false;
      if (activeFilter === 'payments' && n.type !== 'payment') return false;
      if (activeFilter === 'system' && !['system', 'info'].includes(n.type)) return false;

      // Search filter
      if (!query) return true;
      
      const title = (n.title || '').toLowerCase();
      const message = (n.message || '').toLowerCase();
      const type = (n.type || '').toLowerCase();
      
      return title.includes(query) || message.includes(query) || type.includes(query);
    });
  }, [notifications, activeFilter, searchQuery]);

  // Smart grouping by date with relative time
  const groupedNotifications = useMemo(() => {
    if (viewMode === 'chronological') {
      return { 'All Notifications': filteredNotifications };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, any[]> = {
      'Today': [],
      'Yesterday': [], 
      'This Week': [],
      'Earlier': []
    };

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.created_at);
      
      if (date >= today) {
        groups['Today'].push(notification);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(notification);
      } else if (date >= thisWeek) {
        groups['This Week'].push(notification);
      } else {
        groups['Earlier'].push(notification);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, notifications]) => notifications.length > 0)
    );
  }, [filteredNotifications, viewMode]);

  // Enhanced notification click handler
  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      if (notification.action_url.includes('stripe.com') || notification.action_url.includes('checkout')) {
        window.open(notification.action_url, '_blank');
      } else {
        window.location.href = notification.action_url;
      }
    }
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id => markAsRead(id))
      );
      setSelectedNotifications([]);
      modernToast.success({
        title: 'Notifications updated',
        description: `${selectedNotifications.length} notifications marked as read`
      });
    } catch (error) {
      modernToast.error({
        title: 'Update failed',
        description: 'Failed to mark notifications as read'
      });
    }
  };

  // Filter options with counts
  const getFilterOptions = () => {
    const counts = {
      all: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      urgent: notifications.filter(n => n.priority === 'high').length,
      appointments: notifications.filter(n => n.type === 'appointment').length,
      payments: notifications.filter(n => n.type === 'payment').length,
      system: notifications.filter(n => ['system', 'info'].includes(n.type)).length,
    };

    return [
      { value: 'all', label: 'All', count: counts.all, icon: Bell },
      { value: 'unread', label: 'Unread', count: counts.unread, icon: BellRing },
      { value: 'urgent', label: 'Urgent', count: counts.urgent, icon: AlertTriangle },
      { value: 'appointments', label: 'Appointments', count: counts.appointments, icon: Calendar },
      { value: 'payments', label: 'Payments', count: counts.payments, icon: CreditCard },
      { value: 'system', label: 'System', count: counts.system, icon: Settings },
    ];
  };

  const NotificationBell = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "relative hover-scale transition-all duration-200",
        unreadCount > 0 && "border-primary/50 bg-primary/5",
        className
      )}
    >
      <Bell className={cn(
        "h-4 w-4 transition-transform duration-200",
        unreadCount > 0 && "animate-pulse"
      )} />
      {unreadCount > 0 && (
        <Badge 
          variant="default" 
          className={cn(
            "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs",
            "bg-red-500 text-white animate-fade-in",
            unreadCount > 99 && "px-1 w-auto min-w-[20px]"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  const NotificationContent = () => (
    <Card className={cn(
      "shadow-elegant border-primary/10 animate-fade-in",
      variant === 'popover' && "w-[90vw] sm:w-[420px] max-h-[600px]",
      variant === 'sidebar' && "w-full h-full",
      variant === 'modal' && "w-[90vw] sm:w-[500px] max-h-[80vh]"
    )}>
      <CardHeader className="pb-3 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="animate-fade-in">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshNotifications}
                    className="h-8 w-8 p-0 hover-scale"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs hover-scale"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}

            {variant === 'popover' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover-scale"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="pl-9 h-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 hover-scale">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getFilterOptions().map(option => {
                const IconComponent = option.icon;
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setActiveFilter(option.value as FilterType)}
                    className={cn(
                      "flex items-center justify-between",
                      activeFilter === option.value && "bg-primary/10 text-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grouped' ? 'chronological' : 'grouped')}
            className="h-9 hover-scale"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="p-8 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-primary/60" />
            </div>
            <h4 className="font-medium text-muted-foreground mb-2">
              {searchQuery ? 'No matching notifications' : 'All caught up!'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'New notifications will appear here'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[480px]">
            <div className="space-y-4 p-2">
              {Object.entries(groupedNotifications).map(([section, notifications]) => (
                <div key={section} className="space-y-1 animate-fade-in">
                  <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-2 py-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      {section}
                    </div>
                    <Separator className="mt-1" />
                  </div>
                  
                  <div className="space-y-1">
                    {notifications.map((notification: any, index: number) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all duration-200 group",
                          getPriorityStyles(notification.priority, notification.is_read),
                          "hover:shadow-lg hover:-translate-y-0.5",
                          !notification.is_read && "ring-1 ring-primary/20"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 group-hover:scale-110 transition-transform duration-200">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={cn(
                                "font-medium text-sm leading-tight",
                                !notification.is_read ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {notification.title}
                              </h4>
                              
                              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            
                            <p className={cn(
                              "text-sm mt-1 leading-relaxed",
                              !notification.is_read ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {notification.message}
                            </p>
                            
                            {notification.action_label && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 text-xs h-7 hover-scale"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
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
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  if (variant === 'sidebar' || variant === 'modal') {
    return <NotificationContent />;
  }

  return (
    <TooltipProvider>
      <div className="relative">
        <NotificationBell />
        
        {isOpen && (
          <div className="absolute top-12 right-0 z-50 animate-fade-in">
            <NotificationContent />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}