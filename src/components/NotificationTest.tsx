import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { NotificationService } from '../lib/notificationService';
import { NotificationTriggers } from '../lib/notificationTriggers';
import { User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface NotificationTestProps {
  user: User;
}

export const NotificationTest: React.FC<NotificationTestProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBasicNotification = async () => {
    setIsLoading(true);
    try {
      await NotificationService.createNotification(
        user.id,
        'Test Notification',
        'This is a test notification to verify the system is working.',
        'system',
        'info'
      );
      addResult('✅ Basic notification created successfully');
    } catch (error) {
      addResult(`❌ Basic notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAppointmentReminder = async () => {
    setIsLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError || !profile) throw profileError || new Error('Profile not found');
      // Create a test appointment first
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: 'test-dentist-id',
          appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 60,
          status: 'confirmed',
          urgency_level: 'normal'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await NotificationService.createAppointmentReminder(appointment.id, '24h');
      addResult('✅ Appointment reminder created successfully');
    } catch (error) {
      addResult(`❌ Appointment reminder failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrescriptionNotification = async () => {
    setIsLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError || !profile) throw profileError || new Error('Profile not found');
      // Create a test prescription first
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: profile.id,
          dentist_id: 'test-dentist-id',
          medication_name: 'Test Medication',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '7 days',
          instructions: 'Take with food',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await NotificationService.createPrescriptionNotification(prescription.id);
      addResult('✅ Prescription notification created successfully');
    } catch (error) {
      addResult(`❌ Prescription notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTreatmentPlanNotification = async () => {
    setIsLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileError || !profile) throw profileError || new Error('Profile not found');
      // Create a test treatment plan first
      const { data: treatmentPlan, error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: profile.id,
          dentist_id: 'test-dentist-id',
          plan_name: 'Test Treatment Plan',
          title: 'Test Treatment Plan',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await NotificationService.createTreatmentPlanNotification(treatmentPlan.id, 'created');
      addResult('✅ Treatment plan notification created successfully');
    } catch (error) {
      addResult(`❌ Treatment plan notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmergencyNotification = async () => {
    setIsLoading(true);
    try {
      await NotificationTriggers.onEmergencyTriageCompleted(user.id, 'medium');
      addResult('✅ Emergency notification created successfully');
    } catch (error) {
      addResult(`❌ Emergency notification failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDifferentCategories = async () => {
    setIsLoading(true);
    try {
      const categories: Array<{ type: string; category: string; title: string; message: string }> = [
        { type: 'system', category: 'info', title: 'Information', message: 'This is an informational message.' },
        { type: 'system', category: 'success', title: 'Success', message: 'Operation completed successfully!' },
        { type: 'system', category: 'warning', title: 'Warning', message: 'Please be careful with this action.' },
        { type: 'system', category: 'error', title: 'Error', message: 'Something went wrong with the operation.' },
        { type: 'emergency', category: 'urgent', title: 'Urgent Alert', message: 'This requires immediate attention!' }
      ];

      for (const { type, category, title, message } of categories) {
        await NotificationService.createNotification(
          user.id,
          title,
          message,
          type as any,
          category as any
        );
      }

      addResult('✅ All category notifications created successfully');
    } catch (error) {
      addResult(`❌ Category notifications failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotificationPreferences = async () => {
    setIsLoading(true);
    try {
      const preferences = await NotificationService.getNotificationPreferences(user.id);
      addResult(`✅ Notification preferences loaded: ${preferences ? 'Found' : 'Not found'}`);
      
      if (preferences) {
        await NotificationService.updateNotificationPreferences(user.id, {
          email_enabled: !preferences.email_enabled
        });
        addResult('✅ Notification preferences updated successfully');
      }
    } catch (error) {
      addResult(`❌ Notification preferences test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            onClick={testBasicNotification}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Basic Notification
          </Button>
          
          <Button
            onClick={testAppointmentReminder}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Appointment Reminder
          </Button>
          
          <Button
            onClick={testPrescriptionNotification}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Prescription Notification
          </Button>
          
          <Button
            onClick={testTreatmentPlanNotification}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Treatment Plan Notification
          </Button>
          
          <Button
            onClick={testEmergencyNotification}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Emergency Notification
          </Button>
          
          <Button
            onClick={testDifferentCategories}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test All Categories
          </Button>
          
          <Button
            onClick={testNotificationPreferences}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Preferences
          </Button>
          
          <Button
            onClick={clearResults}
            variant="outline"
            size="sm"
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <div className="bg-gray-50 p-3 rounded-md max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Testing...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};