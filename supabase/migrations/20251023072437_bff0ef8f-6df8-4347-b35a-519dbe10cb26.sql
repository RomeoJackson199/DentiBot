-- Add foreign key constraints to appointments table
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_dentist_id_fkey 
  FOREIGN KEY (dentist_id) 
  REFERENCES dentists(id) 
  ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);