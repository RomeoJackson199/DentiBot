import React, { useState, useRef, useEffect } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent rapid clicking
  const handleToggle = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setIsOpen(prev => !prev);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Allow clicking again after a short delay
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isTransitioning}
        className={cn("relative transition-all duration-200", className)}
      >
        <Bell className={cn("h-4 w-4 transition-transform duration-200", isOpen && "scale-110")} />
        {unreadCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-2 -right-2 h-5 min-w-5 w-auto px-1 flex items-center justify-center p-0 text-xs bg-red-500 text-white animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="relative">
            {/* Close button overlay for accessibility */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute -top-9 right-0 h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
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