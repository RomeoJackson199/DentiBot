import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Check, CheckCheck, Mail, MessageSquare, Calendar, AlertCircle, Info, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type NotificationType = 'all' | 'appointment' | 'prescription' | 'payment' | 'system';

export function ComprehensiveNotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationType>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    }
  });

  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data || {
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        appointment_reminders: true,
        prescription_updates: true,
        payment_reminders: true
      };
    }
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast({ title: "All notifications marked as read" });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast({ title: "Notification deleted" });
    }
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updates
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({ title: "Preferences updated" });
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'prescription':
        return <AlertCircle className="h-4 w-4" />;
      case 'payment':
        return <Mail className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'appointment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('appointment')}
                >
                  Appointments
                </Button>
                <Button
                  variant={filter === 'prescription' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('prescription')}
                >
                  Prescriptions
                </Button>
                <Button
                  variant={filter === 'payment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('payment')}
                >
                  Payments
                </Button>
              </div>

              <div className="space-y-2">
                {notifications?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications to display
                  </div>
                ) : (
                  notifications?.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${!notification.is_read ? 'bg-muted/50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getIcon(notification.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{notification.title}</p>
                              <Badge variant={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {!notification.is_read && (
                                <Badge variant="outline">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => markAsRead.mutate(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteNotification.mutate(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences?.email_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ email_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={preferences?.push_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ push_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS notifications</p>
                  </div>
                  <Switch
                    checked={preferences?.sms_enabled}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ sms_enabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <Label>Appointment Reminders</Label>
                  <Switch
                    checked={preferences?.appointment_reminders}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ appointment_reminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Prescription Updates</Label>
                  <Switch
                    checked={preferences?.prescription_updates}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ prescription_updates: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Payment Reminders</Label>
                  <Switch
                    checked={preferences?.payment_reminders}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ payment_reminders: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
