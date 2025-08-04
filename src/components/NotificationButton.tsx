import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Settings, Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../types/common';
import { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

interface NotificationButtonProps {
  user: User;
  className?: string;
}

const getNotificationIcon = (category: Notification['category']) => {
  switch (category) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
    case 'urgent':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationColor = (category: Notification['category']) => {
  switch (category) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'error':
    case 'urgent':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-blue-200 bg-blue-50';
  }
};

export const NotificationButton: React.FC<NotificationButtonProps> = ({ user, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    updatePreferences
  } = useNotifications(user.id);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Handle action URL if present
    if (notification.action_url) {
      // You can implement navigation logic here
      console.log('Navigate to:', notification.action_url);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`relative ${className}`}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="h-6 px-2 text-xs"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400">We'll notify you when there's something new</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                      notification.is_read ? 'opacity-60' : ''
                    } ${getNotificationColor(notification.category)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.category)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-gray-500">
                View all notifications
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Customize how you receive notifications
            </DialogDescription>
          </DialogHeader>
          
          {preferences && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled">Email Notifications</Label>
                  <Switch
                    id="email-enabled"
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) => 
                      updatePreferences({ email_enabled: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-enabled">SMS Notifications</Label>
                  <Switch
                    id="sms-enabled"
                    checked={preferences.sms_enabled}
                    onCheckedChange={(checked) => 
                      updatePreferences({ sms_enabled: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled">Push Notifications</Label>
                  <Switch
                    id="push-enabled"
                    checked={preferences.push_enabled}
                    onCheckedChange={(checked) => 
                      updatePreferences({ push_enabled: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-app-enabled">In-App Notifications</Label>
                  <Switch
                    id="in-app-enabled"
                    checked={preferences.in_app_enabled}
                    onCheckedChange={(checked) => 
                      updatePreferences({ in_app_enabled: checked })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                  <Switch
                    id="appointment-reminders"
                    checked={preferences.appointment_reminders}
                    onCheckedChange={(checked) => 
                      updatePreferences({ appointment_reminders: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="prescription-updates">Prescription Updates</Label>
                  <Switch
                    id="prescription-updates"
                    checked={preferences.prescription_updates}
                    onCheckedChange={(checked) => 
                      updatePreferences({ prescription_updates: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="treatment-plan-updates">Treatment Plan Updates</Label>
                  <Switch
                    id="treatment-plan-updates"
                    checked={preferences.treatment_plan_updates}
                    onCheckedChange={(checked) => 
                      updatePreferences({ treatment_plan_updates: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
                  <Switch
                    id="emergency-alerts"
                    checked={preferences.emergency_alerts}
                    onCheckedChange={(checked) => 
                      updatePreferences({ emergency_alerts: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-notifications">System Notifications</Label>
                  <Switch
                    id="system-notifications"
                    checked={preferences.system_notifications}
                    onCheckedChange={(checked) => 
                      updatePreferences({ system_notifications: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};