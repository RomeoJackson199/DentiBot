import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventEmailService } from '@/lib/eventEmailService';
import { EMAIL_TEMPLATES, EVENT_SCHEMAS } from '@/lib/emailTemplates';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Mail, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

export const EmailSystemDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const emailService = EventEmailService.getInstance();

  const handleTriggerEmail = async (eventType: string) => {
    setIsLoading(true);
    try {
      const mockPatientId = 'mock-patient-123';
      const mockAppointmentId = 'mock-appointment-456';
      
      let result;
      switch (eventType) {
        case 'AppointmentRescheduled':
          result = await emailService.triggerAppointmentRescheduled(
            mockAppointmentId,
            new Date().toISOString(),
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            mockPatientId
          );
          break;
        case 'AppointmentCancelled':
          result = await emailService.triggerAppointmentCancelled(
            mockAppointmentId,
            mockPatientId,
            'Patient request'
          );
          break;
        case 'AppointmentReminderDue':
          result = await emailService.triggerAppointmentReminder(
            mockAppointmentId,
            mockPatientId,
            '24h'
          );
          break;
        default:
          throw new Error(`Event type ${eventType} not supported in demo`);
      }

      if (result.success) {
        toast({
          title: "Email Triggered Successfully",
          description: `${eventType} email has been processed and sent.`
        });
      } else {
        toast({
          title: "Email Failed",
          description: result.reason || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error triggering email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'AppointmentRescheduled':
        return <Calendar className="h-4 w-4" />;
      case 'AppointmentCancelled':
        return <AlertTriangle className="h-4 w-4" />;
      case 'AppointmentReminderDue':
        return <Clock className="h-4 w-4" />;
      case 'AppointmentCompleted':
        return <CheckCircle className="h-4 w-4" />;
      case 'InvoicePaid':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'destructive';
      case 'important':
        return 'default';
      case 'normal':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Event System Demo
          </CardTitle>
          <CardDescription>
            Comprehensive event-driven email system for dental clinic workflows.
            Features GDPR compliance, rate limiting, idempotency, and multi-language support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(EMAIL_TEMPLATES).map(([eventType, template]) => (
              <Card key={eventType} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(eventType)}
                      <h3 className="font-medium text-sm">{eventType}</h3>
                    </div>
                    <Badge variant={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.subject.replace(/{{.*?}}/g, '[dynamic]')}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>Features:</strong>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {'attachments' in template && template.attachments?.includes('appointment.ics') && (
                        <Badge variant="outline" className="text-xs">📅 Calendar</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">🌍 Multi-lang</Badge>
                      {template.priority === 'essential' && (
                        <Badge variant="outline" className="text-xs">⚡ No limits</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">🔒 GDPR</Badge>
                    </div>
                  </div>

                  {['AppointmentRescheduled', 'AppointmentCancelled', 'AppointmentReminderDue'].includes(eventType) && (
                    <Button
                      size="sm"
                      onClick={() => handleTriggerEmail(eventType)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Sending...' : 'Test Email'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Features</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Compliance & Security</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ GDPR compliant (no PHI in emails)</li>
                  <li>✅ Secure portal links with expiring tokens</li>
                  <li>✅ Audit logging for all emails</li>
                  <li>✅ Idempotency keys prevent duplicates</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Rate Limiting</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🚨 Essential: No limits (confirmations, receipts)</li>
                  <li>⚠️ Important: Max 5 per patient per 24h</li>
                  <li>📢 Normal: Max 3 per patient per 24h</li>
                  <li>🔄 Automatic retry for failed sends</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Localization</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🇬🇧 English (EN)</li>
                  <li>🇫🇷 French (FR)</li>
                  <li>🇳🇱 Dutch (NL)</li>
                  <li>🇩🇪 German (DE)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Event Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>📅 Appointment lifecycle</li>
                  <li>💰 Payment & billing events</li>
                  <li>🦷 Treatment plan updates</li>
                  <li>🔔 Recalls & reminders</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};