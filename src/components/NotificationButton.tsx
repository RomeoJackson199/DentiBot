import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { EnhancedNotificationCenter } from './notifications/EnhancedNotificationCenter';
import { cn } from '@/lib/utils';

interface NotificationButtonProps {
  userId: string;
  className?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ userId, className }) => {
  const { unreadCount } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn("relative", className)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-2 -right-2 h-5 min-w-5 w-auto px-1 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 z-50 animate-fade-in">
          <div className="relative">
            {/* Close button overlay for accessibility */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute -top-9 right-0 h-8 w-8 p-0"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Render content-only center to avoid duplicate bell */}
            <EnhancedNotificationCenter userId={userId} variant="modal" />
          </div>
        </div>
      )}
    </div>
  );
};