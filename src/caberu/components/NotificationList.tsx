import type { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NotificationListProps {
  notifications: Array<{ id: string; message: string; sendAt: string }>;
}

export const NotificationList: FC<NotificationListProps> = ({ notifications }) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 && <p className="text-sm text-slate-500">No reminders yet. Caberu will nudge clients before sessions.</p>}
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-xl border bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{notification.message}</p>
            <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(notification.sendAt), { addSuffix: true })}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
