-- Check if patient_notes table exists and add it if missing
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_notes
DROP POLICY IF EXISTS "Dentists can manage patient notes" ON public.patient_notes;
CREATE POLICY "Dentists can manage patient notes" 
ON public.patient_notes 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = patient_notes.dentist_id AND p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Patients can view their own notes" ON public.patient_notes;
CREATE POLICY "Patients can view their own notes" 
ON public.patient_notes 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = patient_notes.patient_id AND p.user_id = auth.uid()
));

-- Update medical_records table to fix the record_date field
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS record_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Drop the old visit_date column if it exists and we have record_date
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'medical_records' 
               AND column_name = 'visit_date') THEN
        -- Copy data from visit_date to record_date if needed
        UPDATE public.medical_records 
        SET record_date = visit_date 
        WHERE record_date IS NULL OR record_date = CURRENT_DATE;
        
        -- Drop visit_date column
        ALTER TABLE public.medical_records DROP COLUMN visit_date;
    END IF;
END $$;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for patient_notes
DROP TRIGGER IF EXISTS update_patient_notes_updated_at ON public.patient_notes;
CREATE TRIGGER update_patient_notes_updated_at
    BEFORE UPDATE ON public.patient_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();