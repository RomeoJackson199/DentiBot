import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernNotificationCenter } from '@/components/notifications/ModernNotificationCenter';
import { Button } from '@/components/ui/button';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const NotificationTestPage: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const createTestNotification = async () => {
    if (!user) return;
    
    try {
      await NotificationService.createNotification(
        user.id,
        '🎉 Test Notification',
        'This is a test notification to check the positioning and functionality of the new notification system!',
        'system',
        'info'
      );
      
      toast({
        title: "Test notification created!",
        description: "Check the notification bell to see it.",
      });
    } catch (error) {
      toast({
        title: "Error creating notification",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to test notifications</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      {/* Header with notification */}
      <div className="fixed top-4 right-4 z-50">
        <ModernNotificationCenter userId={user.id} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔔 Notification System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page demonstrates the improved notification system with proper positioning, 
              high z-index, and viewport collision detection.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">✅ Fixed Issues</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Notifications no longer go off-screen</li>
                  <li>• Proper z-index (9999) ensures visibility</li>
                  <li>• Backdrop blur for better contrast</li>
                  <li>• Collision detection with viewport edges</li>
                  <li>• Smooth animations and transitions</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">🎯 Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Smart filtering and search</li>
                  <li>• Priority-based styling</li>
                  <li>• Real-time updates</li>
                  <li>• Mark as read functionality</li>
                  <li>• Mobile & desktop optimized</li>
                </ul>
              </div>
            </div>

            <Button onClick={createTestNotification} className="w-full">
              Create Test Notification
            </Button>
          </CardContent>
        </Card>

        {/* Test content to show scrolling */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Test Card {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is test content to demonstrate that the notification system 
                works properly even when there's a lot of content on the page. 
                The notification bell in the top-right should always be accessible 
                and notifications should appear in the correct position.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};