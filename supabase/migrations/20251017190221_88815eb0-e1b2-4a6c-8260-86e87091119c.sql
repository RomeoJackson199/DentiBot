-- Create clinic_settings table for branding and AI customization
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  
  -- Basic Branding
  clinic_name TEXT,
  tagline TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0F3D91',
  secondary_color TEXT DEFAULT '#66D2D6',
  
  -- Specialty
  specialty_type TEXT DEFAULT 'dentist' CHECK (specialty_type IN ('dentist', 'neurologist', 'cardiologist', 'pediatrician', 'dermatologist', 'orthopedist', 'psychiatrist', 'general_practitioner')),
  
  -- AI Customization
  ai_instructions TEXT,
  ai_tone TEXT DEFAULT 'professional' CHECK (ai_tone IN ('professional', 'friendly', 'casual', 'empathetic', 'formal')),
  ai_response_length TEXT DEFAULT 'normal' CHECK (ai_response_length IN ('brief', 'normal', 'detailed')),
  welcome_message TEXT,
  
  -- Keywords for AI triggers
  appointment_keywords TEXT[] DEFAULT ARRAY['appointment', 'booking', 'schedule', 'rendez-vous']::TEXT[],
  emergency_keywords TEXT[] DEFAULT ARRAY['emergency', 'urgent', 'pain', 'bleeding', 'urgence', 'douleur']::TEXT[],
  
  -- Display Settings
  show_logo_in_chat BOOLEAN DEFAULT true,
  show_branding_in_emails BOOLEAN DEFAULT true,
  
  -- Business Hours
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "17:00"},
    "tuesday": {"open": "09:00", "close": "17:00"},
    "wednesday": {"open": "09:00", "close": "17:00"},
    "thursday": {"open": "09:00", "close": "17:00"},
    "friday": {"open": "09:00", "close": "17:00"},
    "saturday": {"open": "09:00", "close": "13:00"},
    "sunday": {"closed": true}
  }'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(dentist_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clinic_settings_dentist ON clinic_settings(dentist_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_specialty ON clinic_settings(specialty_type);

-- Enable RLS
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Dentists can manage their own clinic settings"
  ON clinic_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dentists d
      JOIN profiles p ON p.id = d.profile_id
      WHERE d.id = clinic_settings.dentist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view clinic settings for their dentists"
  ON clinic_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.dentist_id = clinic_settings.dentist_id
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = a.patient_id
        AND p.user_id = auth.uid()
      )
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_clinic_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinic_settings_updated_at
  BEFORE UPDATE ON clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_settings_updated_at();