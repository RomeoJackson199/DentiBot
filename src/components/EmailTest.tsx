import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';

export const EmailTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const testEmail = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('Testing email notification for user:', user.id);
      
      const notificationId = await NotificationService.createNotification(
        user.id,
        '🧪 Email Test - Working!',
        'This is a test email notification. If you receive this, your email notifications are working perfectly!',
        'system',
        'info',
        undefined,
        { test: true },
        undefined,
        true // sendEmail
      );

      console.log('Notification created with ID:', notificationId);
      
      setResult('success');
      toast({
        title: "✅ Email Test Sent!",
        description: "Check your email inbox. The test notification should arrive shortly.",
      });
      
    } catch (error) {
      console.error('Email test failed:', error);
      setResult('error');
      toast({
        title: "❌ Email Test Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Test if email notifications are working by sending a test email to your registered email address.
        </p>
        
        <Button 
          onClick={testEmail} 
          disabled={testing}
          className="w-full"
          variant={result === 'success' ? 'default' : result === 'error' ? 'destructive' : 'default'}
        >
          {testing ? (
            <>
              <Mail className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Email...
            </>
          ) : result === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Email Sent Successfully!
            </>
          ) : result === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Failed - Try Again
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        {result === 'success' && (
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ Test email sent! Check your inbox and spam folder.
            </p>
          </div>
        )}

        {result === 'error' && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              ❌ Something went wrong. Check the console for details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};