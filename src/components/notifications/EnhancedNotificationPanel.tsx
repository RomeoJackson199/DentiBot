import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCheck, 
  X, 
  Calendar,
  CreditCard,
  Pill,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  Clock
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedNotificationPanelProps {
  userId: string;
  onClose: () => void;
}

type FilterType = 'all' | 'unread' | 'urgent';

export function EnhancedNotificationPanel({ userId, onClose }: EnhancedNotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications(userId);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'appointment':
        return <Calendar className={cn(iconClass, "text-blue-500")} />;
      case 'prescription':
        return <Pill className={cn(iconClass, "text-green-500")} />;
      case 'payment':
        return <CreditCard className={cn(iconClass, "text-purple-500")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
      case 'treatment_plan':
        return <Info className={cn(iconClass, "text-orange-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-500")} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500 text-white">Urgent</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Important</Badge>;
      default:
        return null;
    }
  };

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return notifications.filter((n: any) => {
      if (activeFilter === 'unread' && n.is_read) return false;
      if (activeFilter === 'urgent' && n.priority !== 'high') return false;
      if (!query) return true;
      
      const title = (n.title || '').toLowerCase();
      const message = (n.message || '').toLowerCase();
      
      return title.includes(query) || message.includes(query);
    });
  }, [notifications, activeFilter, searchQuery]);

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const groups: Record<string, any[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.created_at);
      
      if (date >= today) {
        groups['Today'].push(notification);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(notification);
      } else {
        groups['Earlier'].push(notification);
      }
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([_, notifications]) => notifications.length > 0)
    );
  }, [filteredNotifications]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      if (notification.action_url.includes('stripe.com') || notification.action_url.includes('checkout')) {
        window.open(notification.action_url, '_blank');
      } else {
        onClose();
        window.location.href = notification.action_url;
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed top-16 right-4 w-[480px] max-h-[640px] z-[10001] shadow-2xl"
    >
      <Card className="border-primary/20 bg-background shadow-elegant overflow-hidden">
        <CardHeader className="pb-4 border-b bg-gradient-to-br from-primary/5 to-transparent sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => refreshNotifications()}
                className="hover:bg-primary/10 transition-all hover:scale-110"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="hover:bg-primary/10 transition-all text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="pl-9 h-10 bg-background/50 border-primary/20 focus-visible:ring-primary/20"
              />
            </div>
            
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
              {['all', 'unread', 'urgent'].map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter as FilterType)}
                  className={cn(
                    "text-xs h-8 px-3 capitalize transition-all",
                    activeFilter === filter && "shadow-md"
                  )}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-primary/60" />
              </div>
              <h4 className="font-semibold text-lg mb-2">
                {searchQuery ? 'No matching notifications' : 'All caught up!'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Try different search terms' 
                  : 'New notifications will appear here'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[520px]">
              <div className="p-4 space-y-4">
                <AnimatePresence>
                  {Object.entries(groupedNotifications).map(([section, notifications]) => (
                    <motion.div 
                      key={section}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                          {section}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                      
                      <div className="space-y-2">
                        {notifications.map((notification: any, index: number) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "p-4 rounded-xl cursor-pointer transition-all duration-200 border",
                              "hover:shadow-md hover:scale-[1.02] hover:border-primary/30",
                              !notification.is_read 
                                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm" 
                                : "bg-muted/30 border-transparent hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 p-2 rounded-lg bg-background shadow-sm">
                                {getNotificationIcon(notification.type, notification.priority)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={cn(
                                      "font-semibold text-sm",
                                      !notification.is_read ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    {getPriorityBadge(notification.priority)}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    )}
                                  </div>
                                </div>
                                
                                <p className={cn(
                                  "text-sm leading-relaxed mb-2",
                                  !notification.is_read ? "text-foreground/80" : "text-muted-foreground"
                                )}>
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </span>
                                  
                                  {notification.action_label && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs h-7 hover:bg-primary hover:text-primary-foreground transition-all"
                                    >
                                      {notification.action_label}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}