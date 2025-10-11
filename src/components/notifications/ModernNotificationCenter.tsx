import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  BellRing,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { QuietModeToggle } from "@/components/notifications/QuietModeToggle";
import { EnhancedNotificationPanel } from "@/components/notifications/EnhancedNotificationPanel";

interface ModernNotificationCenterProps {
  userId: string;
  className?: string;
}

type FilterType = 'all' | 'unread' | 'urgent' | 'appointments' | 'payments' | 'system';

export function ModernNotificationCenter({ userId, className }: ModernNotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);

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

  if (error) {
    modernToast.error({
      title: 'Notification Error',
      description: error
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative hover:scale-105 transition-all duration-200",
          unreadCount > 0 && "border-primary/50 bg-primary/5 shadow-lg",
          className
        )}
      >
        <Bell className={cn(
          "h-4 w-4 transition-transform duration-200",
          unreadCount > 0 && "animate-pulse text-primary"
        )} />
        {unreadCount > 0 && (
          <Badge 
            variant="default" 
            className={cn(
              "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs",
              "bg-red-500 text-white animate-bounce border-2 border-background shadow-lg",
              unreadCount > 99 && "px-1 w-auto min-w-[20px]"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <EnhancedNotificationPanel 
            userId={userId}
            onClose={() => setIsOpen(false)}
          />
        </>
      )}
    </>
  );
}