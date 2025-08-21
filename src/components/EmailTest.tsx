
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertCircle, User } from 'lucide-react';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';

export const EmailTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const testEmail = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting email test...');
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated. Please log in first.');
      }

      console.log('✅ User authenticated:', user.id);
        
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error('Profile not found. Please complete your profile first.');
      }

      console.log('✅ Profile fetched:', { 
        email: profile.email, 
        name: `${profile.first_name} ${profile.last_name}` 
      });

      const recipientEmail = profile.email;
      if (!recipientEmail) {
        throw new Error('No email address found in your profile. Please add an email address.');
      }
      
      console.log('📧 Sending test email to:', recipientEmail);
        
      const notificationId = await NotificationService.createNotification(
        user.id,
        '🧪 Email Test - System Working!',
        `Hi ${profile.first_name || 'there'}! This is a test email to verify that your email notifications are working perfectly. If you receive this, everything is configured correctly!`,
        'system',
        'info',
        undefined,
        { 
          test: true, 
          email: recipientEmail,
          timestamp: new Date().toISOString()
        },
        undefined,
        true // Enable email sending
      );

      console.log('✅ Notification created with ID:', notificationId);
      
      setResult('success');
      toast({
        title: "✅ Email Test Sent!",
        description: `Test email sent to ${recipientEmail}. Check your inbox and spam folder.`,
      });
      
    } catch (error) {
      console.error('❌ Email test failed:', error);
      setResult('error');
      
      // Show the actual error message to help debug
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', error);
      
      toast({
        title: "❌ Email Test Failed",
        description: `Error: ${errorMessage}`,
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
          Email System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <User className="h-5 w-5 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">Test Your Email Integration</p>
            <p className="text-blue-600 dark:text-blue-400">
              This will send a test email to your registered email address to verify that Twilio SendGrid is working correctly.
            </p>
          </div>
        </div>
        
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
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Test email sent successfully! Check your inbox and spam folder.
              </p>
            </div>
          </div>
        )}

        {result === 'error' && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">❌ Email test failed</p>
                <p className="mt-1">Check the console logs for details or verify your Twilio SendGrid configuration in the edge function settings.</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Valid TWILIO_API_KEY configured in Supabase secrets</li>
            <li>Email address in your profile</li>
            <li>Active internet connection</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
