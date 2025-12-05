import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function EmailTestTab() {
    const { toast } = useToast();
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

    const sendTestEmail = async () => {
        if (!testEmail) {
            toast({
                title: "Email Required",
                description: "Please enter an email address",
                variant: "destructive",
            });
            return;
        }

        setSending(true);
        setLastResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('send-email-notification', {
                body: {
                    to: testEmail,
                    subject: '[SYSTEM TEST] Caberu Email Configuration Test',
                    message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Email System Test</h1>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; color: #333;">
                  This is a test email from the Caberu Super Admin Dashboard.
                </p>
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #155724; font-weight: bold;">
                    ✓ SendGrid API is working correctly
                  </p>
                </div>
                <p style="font-size: 14px; color: #666;">
                  Sent at: ${new Date().toISOString()}<br>
                  Environment: ${typeof window !== 'undefined' ? window.location.origin : 'Unknown'}
                </p>
              </div>
            </div>
          `,
                    messageType: 'system',
                    isSystemNotification: true,
                },
            });

            if (error) throw error;

            setLastResult({
                success: true,
                message: `Test email sent to ${testEmail}`,
            });

            toast({
                title: "Test Email Sent!",
                description: `Check your inbox at ${testEmail}`,
            });
        } catch (error: any) {
            setLastResult({
                success: false,
                message: error.message || 'Failed to send test email',
            });

            toast({
                title: "Email Test Failed",
                description: error.message || 'Unknown error occurred',
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email System Test
                    </CardTitle>
                    <CardDescription>
                        Test the email sending configuration (SendGrid)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="test-email">Email Address</Label>
                        <div className="flex gap-2">
                            <Input
                                id="test-email"
                                type="email"
                                placeholder="Enter email to test..."
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                            <Button onClick={sendTestEmail} disabled={sending}>
                                {sending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Test
                            </Button>
                        </div>
                    </div>

                    {lastResult && (
                        <div className={`p-4 rounded-lg border ${lastResult.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center gap-2">
                                {lastResult.success ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span className={lastResult.success ? 'text-green-800' : 'text-red-800'}>
                                    {lastResult.message}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Email Configuration</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Provider:</span>
                                <Badge variant="secondary">SendGrid (Twilio)</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Sender:</span>
                                <span>Romeo@caberu.be</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">API Key:</span>
                                <Badge variant="outline">TWILIO_API_KEY</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
