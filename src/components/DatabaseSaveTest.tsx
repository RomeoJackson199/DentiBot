import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface TestRecord {
  id?: string;
  type: 'prescription' | 'treatment_plan' | 'medical_record' | 'patient_note';
  title: string;
  description?: string;
  created_at?: string;
}

export function DatabaseSaveTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [savedRecords, setSavedRecords] = useState<TestRecord[]>([]);
  const [formData, setFormData] = useState<{
    type: 'prescription' | 'treatment_plan' | 'medical_record' | 'patient_note';
    title: string;
    description: string;
  }>({
    type: 'prescription' as const,
    title: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
    fetchSavedRecords();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setPatientData(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSavedRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Fetch different types of records
      const [prescriptions, treatmentPlans, medicalRecords, patientNotes] = await Promise.all([
        supabase.from('prescriptions').select('id, medication_name as title, instructions as description, created_at').eq('patient_id', profile.id),
        supabase.from('treatment_plans').select('id, title, description, created_at').eq('patient_id', profile.id),
        supabase.from('medical_records').select('id, title, description, created_at').eq('patient_id', profile.id),
        supabase.from('patient_notes').select('id, title, content as description, created_at').eq('patient_id', profile.id)
      ]);

      const allRecords: TestRecord[] = [
        ...((prescriptions.data || []) as any[]).map((r: any) => ({ ...r, type: 'prescription' as const })),
        ...((treatmentPlans.data || []) as any[]).map((r: any) => ({ ...r, type: 'treatment_plan' as const })),
        ...((medicalRecords.data || []) as any[]).map((r: any) => ({ ...r, type: 'medical_record' as const })),
        ...((patientNotes.data || []) as any[]).map((r: any) => ({ ...r, type: 'patient_note' as const }))
      ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      setSavedRecords(allRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleSave = async () => {
    if (!patientData || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find a dentist to assign (for testing purposes)
      const { data: dentists } = await supabase
        .from('dentists')
        .select('id')
        .limit(1);

      const dentistId = dentists?.[0]?.id;
      if (!dentistId) {
        throw new Error('No dentist found for testing');
      }

      let result;
      switch (formData.type) {
        case 'prescription':
          result = await supabase.from('prescriptions').insert({
            patient_id: patientData.id,
            dentist_id: dentistId,
            medication_name: formData.title,
            dosage: '1 tablet',
            frequency: 'Daily',
            duration_days: 7,
            instructions: formData.description || 'Take as directed'
          });
          break;

        case 'treatment_plan':
          result = await supabase.from('treatment_plans').insert({
            patient_id: patientData.id,
            dentist_id: dentistId,
            title: formData.title,
            description: formData.description,
            status: 'active'
          });
          break;

        case 'medical_record':
          result = await supabase.from('medical_records').insert({
            patient_id: patientData.id,
            dentist_id: dentistId,
            record_type: 'consultation',
            title: formData.title,
            description: formData.description
          });
          break;

        case 'patient_note':
          result = await supabase.from('patient_notes').insert({
            patient_id: patientData.id,
            dentist_id: dentistId,
            note_type: 'general',
            title: formData.title,
            content: formData.description || 'No content',
            is_private: false
          });
          break;
      }

      if (result?.error) throw result.error;

      toast({
        title: "Success",
        description: `${formData.type.replace('_', ' ')} saved successfully!`
      });

      // Reset form
      setFormData({
        type: 'prescription',
        title: '',
        description: ''
      });

      // Refresh records
      await fetchSavedRecords();

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save record",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Save & View Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientData ? (
            <div className="p-4 bg-green-50 rounded-lg">
              <p><strong>Logged in as:</strong> {patientData.first_name} {patientData.last_name}</p>
              <p><strong>Role:</strong> {patientData.role}</p>
              <p><strong>Email:</strong> {patientData.email}</p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg">
              <p>Please log in to test database functionality</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Test Record</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Record Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="prescription">Prescription</option>
                <option value="treatment_plan">Treatment Plan</option>
                <option value="medical_record">Medical Record</option>
                <option value="patient_note">Patient Note</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isLoading || !patientData}
              className="w-full"
            >
              {isLoading ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Records ({savedRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {savedRecords.length === 0 ? (
            <p className="text-muted-foreground">No records found. Try saving one above!</p>
          ) : (
            <div className="space-y-3">
              {savedRecords.map((record) => (
                <div key={`${record.type}-${record.id}`} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{record.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Type: {record.type.replace('_', ' ')} | 
                        Created: {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                      {record.description && (
                        <p className="text-sm mt-1">{record.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}