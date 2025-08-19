import React from 'react';
import { NotificationManager } from './notifications/NotificationManager';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationButtonProps {
  userId: string;
  className?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ userId, className }) => {
  return (
    <NotificationManager
      userId={userId}
      enableBanners={true}
      enableToasts={true}
      bannerPosition="top"
      className={className}
    />
  );
};