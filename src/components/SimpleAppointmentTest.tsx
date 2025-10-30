import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SimpleAppointmentTestProps {
  user: User;
}

export const SimpleAppointmentTest = ({ user }: SimpleAppointmentTestProps) => {
  const [result, setResult] = useState<string>('Loading...');

  const testAppointments = async () => {
    try {
      setResult('Testing...');
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        setResult(`Profile error: ${profileError.message}`);
        return;
      }

      // Get appointments for this patient
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profile.id);

      if (appointmentsError) {
        setResult(`Appointments error: ${appointmentsError.message}`);
        return;
      }

      setResult(`Found ${appointments?.length || 0} appointments for patient ${profile.id}`);
      
      if (appointments && appointments.length > 0) {
        setResult(prev => prev + `\n\nFirst appointment: ${JSON.stringify(appointments[0], null, 2)}`);
      }

    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    testAppointments();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simple Appointment Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testAppointments} className="mb-4">
          Test Again
        </Button>
        <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      </CardContent>
    </Card>
  );
};