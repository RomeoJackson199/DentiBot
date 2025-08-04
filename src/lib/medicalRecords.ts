// Medical records utility functions
export interface MedicalRecord {
  id: string;
  patient_id: string;
  dentist_id: string;
  visit_date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  previous_treatments: string[];
}

// Mock data for development
export const getMockMedicalRecords = (): MedicalRecord[] => [
  {
    id: '1',
    patient_id: 'patient-1',
    dentist_id: 'dentist-1',
    visit_date: '2024-01-15',
    diagnosis: 'Regular cleaning',
    treatment: 'Dental prophylaxis',
    notes: 'Patient maintains good oral hygiene',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const getMedicalHistory = async (patientId: string): Promise<MedicalHistory> => {
  // This would normally fetch from the database
  return {
    allergies: ['Penicillin'],
    medications: ['Ibuprofen'],
    conditions: ['Diabetes Type 2'],
    previous_treatments: ['Root canal', 'Filling'],
  };
};

export const createMedicalRecord = async (record: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalRecord> => {
  // Mock implementation
  return {
    ...record,
    id: `record-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const generateMedicalRecordFromChat = async (chatData: any): Promise<MedicalRecord> => {
  // Mock implementation for generating medical record from chat
  return createMedicalRecord({
    patient_id: chatData.patient_id || 'unknown',
    dentist_id: chatData.dentist_id || 'unknown',
    visit_date: new Date().toISOString().split('T')[0],
    diagnosis: 'Chat consultation',
    treatment: 'Online assessment',
    notes: `Generated from chat: ${chatData.message || ''}`,
  });
};

export const createDossierAfterSignup = async (userId: string): Promise<void> => {
  // Mock implementation for creating patient dossier after signup
  console.log(`Creating dossier for user: ${userId}`);
};