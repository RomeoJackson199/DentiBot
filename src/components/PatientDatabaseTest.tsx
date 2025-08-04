import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function PatientDatabaseTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testPatientSave = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addResult('❌ No authenticated user found');
        return;
      }
      addResult('✅ User authenticated');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        addResult('❌ No profile found for user');
        return;
      }
      addResult('✅ User profile found');

      // Find a dentist for testing
      const { data: dentists } = await supabase
        .from('dentists')
        .select('id')
        .limit(1);

      const dentistId = dentists?.[0]?.id;
      if (!dentistId) {
        addResult('❌ No dentist found for testing');
        return;
      }
      addResult('✅ Dentist found for testing');

      // Test 1: Create a prescription
      try {
        const { data: prescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: profile.id,
            dentist_id: dentistId,
            medication_name: 'Test Medication',
            dosage: '1 tablet',
            frequency: 'Daily',
            duration_days: 7,
            instructions: 'Take as directed'
          })
          .select()
          .single();

        if (prescriptionError) {
          addResult(`❌ Prescription insert failed: ${prescriptionError.message}`);
        } else {
          addResult('✅ Prescription created successfully');
        }
      } catch (error: any) {
        addResult(`❌ Prescription test error: ${error.message}`);
      }

      // Test 2: Create a treatment plan
      try {
        const { data: treatmentPlan, error: treatmentPlanError } = await supabase
          .from('treatment_plans')
          .insert({
            patient_id: profile.id,
            dentist_id: dentistId,
            title: 'Test Treatment Plan',
            description: 'Test treatment plan description',
            status: 'active'
          })
          .select()
          .single();

        if (treatmentPlanError) {
          addResult(`❌ Treatment plan insert failed: ${treatmentPlanError.message}`);
        } else {
          addResult('✅ Treatment plan created successfully');
        }
      } catch (error: any) {
        addResult(`❌ Treatment plan test error: ${error.message}`);
      }

      // Test 3: Create a medical record
      try {
        const { data: medicalRecord, error: medicalRecordError } = await supabase
          .from('medical_records')
          .insert({
            patient_id: profile.id,
            dentist_id: dentistId,
            record_type: 'consultation',
            title: 'Test Medical Record',
            description: 'Test medical record description'
          })
          .select()
          .single();

        if (medicalRecordError) {
          addResult(`❌ Medical record insert failed: ${medicalRecordError.message}`);
        } else {
          addResult('✅ Medical record created successfully');
        }
      } catch (error: any) {
        addResult(`❌ Medical record test error: ${error.message}`);
      }

      // Test 4: Create a patient note
      try {
        const { data: patientNote, error: patientNoteError } = await supabase
          .from('patient_notes')
          .insert({
            patient_id: profile.id,
            dentist_id: dentistId,
            note_type: 'general',
            title: 'Test Patient Note',
            content: 'Test patient note content',
            is_private: false
          })
          .select()
          .single();

        if (patientNoteError) {
          addResult(`❌ Patient note insert failed: ${patientNoteError.message}`);
        } else {
          addResult('✅ Patient note created successfully');
        }
      } catch (error: any) {
        addResult(`❌ Patient note test error: ${error.message}`);
      }

      addResult('🎉 All tests completed!');

    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Database Save Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This test will verify that patient save operations work correctly after the database fixes.
          </p>
          
          <Button 
            onClick={testPatientSave} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Running Tests...' : 'Run Database Tests'}
          </Button>

          {testResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}