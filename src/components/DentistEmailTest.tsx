import React, { useState, useEffect } from 'react';
import { Mail, User, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { NotificationService } from '../lib/notificationService';
import { supabase } from '../integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface DentistEmailTestProps {
  dentistId: string;
  className?: string;
}

export const DentistEmailTest: React.FC<DentistEmailTestProps> = ({ 
  dentistId, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [title, setTitle] = useState('🧪 Email Test - From Your Dentist');
  const [message, setMessage] = useState('This is a test email to verify that email notifications are working properly. If you receive this, everything is configured correctly!');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  // Fetch patients for the dentist
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      
      // Get patients who have appointments with this dentist
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          profiles!inner(
            id,
            user_id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('dentist_id', dentistId)
        .not('patient_id', 'is', null);

      if (error) {
        console.error('Error fetching patients:', error);
        toast({
          title: "Error",
          description: "Failed to fetch patients",
          variant: "destructive",
        });
        return;
      }

      // Extract unique patients with valid emails
      const uniquePatients = data?.reduce((acc: Patient[], appointment: any) => {
        const patient = appointment.profiles;
        if (patient && patient.email && !acc.find(p => p.id === patient.id)) {
          acc.push(patient);
        }
        return acc;
      }, []) || [];

      setPatients(uniquePatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!selectedPatient || !title || !message) {
      toast({
        title: "Error",
        description: "Please select a patient and fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      setResult(null);
      
      // Find the patient
      const patient = patients.find(p => p.id === selectedPatient);
      if (!patient) {
        throw new Error('Patient not found');
      }

      console.log('Sending test email to:', patient.email, 'for user:', patient.user_id);

      // Send notification with email enabled
      const notificationId = await NotificationService.createNotification(
        patient.user_id,
        title,
        message,
        'system',
        'info',
        undefined, // action_url
        {
          test: true,
          email: patient.email,
          sent_by_dentist: dentistId,
          patient_id: selectedPatient
        },
        undefined, // expires_at
        true // sendEmail - this is the key parameter
      );

      console.log('Test notification created with ID:', notificationId);
      
      setResult('success');
      toast({
        title: "✅ Test Email Sent!",
        description: `Test email sent to ${patient.first_name} ${patient.last_name} (${patient.email})`,
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
      setIsSending(false);
    }
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Mail className="h-4 w-4 mr-2" />
          Test Email System
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Email Notifications
          </DialogTitle>
          <DialogDescription>
            Send a test email to verify that the Twilio SendGrid integration is working properly.
            Select a patient and customize the test message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient-search">Select Patient to Test Email</Label>
            <Input
              id="patient-search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading patients...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No patients found with email addresses
                  </p>
                ) : (
                  filteredPatients.map((patient) => (
                    <Card
                      key={patient.id}
                      className={`cursor-pointer transition-colors ${
                        selectedPatient === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPatient(patient.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {patient.email}
                            </p>
                          </div>
                          {selectedPatient === patient.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Test Email Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-title">Email Subject</Label>
              <Input
                id="test-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-message">Email Message</Label>
              <Textarea
                id="test-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Test email message..."
                rows={4}
              />
            </div>
          </div>

          {/* Result Display */}
          {result === 'success' && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Test email sent successfully! Check the recipient's inbox and spam folder.
                </p>
              </div>
            </div>
          )}

          {result === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  ❌ Test email failed. Check the console for details or verify your Twilio SendGrid configuration.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={sendTestEmail}
              disabled={!selectedPatient || !title || !message || isSending}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Test...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};