import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface AppointmentDebugProps {
  user: User;
}

export const AppointmentDebug = ({ user }: AppointmentDebugProps) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting appointment debug...');

      // 1. Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

      console.log('Profile:', profile);
      console.log('Profile error:', profileError);

      if (profileError) {
        setDebugInfo({ error: 'Profile error: ' + profileError.message });
        return;
      }

      // 2. Check total appointments
      const { count: totalAppointments, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      console.log('Total appointments:', totalAppointments);
      console.log('Count error:', countError);

      // 3. Get patient appointments
      const { data: patientAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profile.id);

      console.log('Patient appointments:', patientAppointments);
      console.log('Appointments error:', appointmentsError);

      // 4. Get all appointments for debugging
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('*')
        .limit(10);

      console.log('All appointments sample:', allAppointments);
      console.log('All appointments error:', allError);

      setDebugInfo({
        profile,
        totalAppointments,
        patientAppointments: patientAppointments || [],
        allAppointments: allAppointments || [],
        errors: {
          profileError,
          countError,
          appointmentsError,
          allError
        }
      });

    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebug();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Appointment Debug
          <Button onClick={runDebug} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {debugInfo ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Profile Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.profile, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Total Appointments:</h3>
              <p className="text-lg font-bold">{debugInfo.totalAppointments || 0}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Patient Appointments ({debugInfo.patientAppointments?.length || 0}):</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(debugInfo.patientAppointments, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Sample All Appointments:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(debugInfo.allAppointments, null, 2)}
              </pre>
            </div>

            {debugInfo.errors && Object.values(debugInfo.errors).some(Boolean) && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Errors:</h3>
                <pre className="bg-red-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.errors, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.error && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">General Error:</h3>
                <p className="text-red-600">{debugInfo.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading debug information...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};