-- Add business_slug to clinic_settings for unique clinic URLs
ALTER TABLE clinic_settings 
ADD COLUMN IF NOT EXISTS business_slug TEXT UNIQUE;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinic_settings_business_slug ON clinic_settings(business_slug);

-- Create patient_dentist_relationships table for multi-tenant patient connections
CREATE TABLE IF NOT EXISTS patient_dentist_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(patient_id, dentist_id)
);

-- Enable RLS on patient_dentist_relationships
ALTER TABLE patient_dentist_relationships ENABLE ROW LEVEL SECURITY;

-- Patients can view their own relationships
CREATE POLICY "Patients can view own relationships"
ON patient_dentist_relationships FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = patient_dentist_relationships.patient_id
    AND p.user_id = auth.uid()
  )
);

-- Dentists can view their patient relationships
CREATE POLICY "Dentists can view their patient relationships"
ON patient_dentist_relationships FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = patient_dentist_relationships.dentist_id
    AND p.user_id = auth.uid()
  )
);

-- System can create relationships
CREATE POLICY "System can create relationships"
ON patient_dentist_relationships FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_patient_dentist_relationships_updated_at
BEFORE UPDATE ON patient_dentist_relationships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();