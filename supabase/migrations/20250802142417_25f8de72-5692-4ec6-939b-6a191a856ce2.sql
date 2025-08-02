-- Create ratings and reviews table
CREATE TABLE public.dentist_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  wait_time_rating INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, appointment_id)
);

-- Enable RLS
ALTER TABLE public.dentist_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ratings" 
ON public.dentist_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Patients can create ratings for their appointments" 
ON public.dentist_ratings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.id = appointment_id 
    AND p.user_id = auth.uid()
    AND a.patient_id = patient_id
  )
);

CREATE POLICY "Patients can update their own ratings" 
ON public.dentist_ratings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Add average rating to dentists table
ALTER TABLE public.dentists 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_ratings INTEGER DEFAULT 0,
ADD COLUMN expertise_score DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN communication_score DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN wait_time_score DECIMAL(3,2) DEFAULT 0.00;

-- Create function to update dentist ratings
CREATE OR REPLACE FUNCTION public.update_dentist_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dentists 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
    ),
    expertise_score = (
      SELECT COALESCE(AVG(expertise_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND expertise_rating IS NOT NULL
    ),
    communication_score = (
      SELECT COALESCE(AVG(communication_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND communication_rating IS NOT NULL
    ),
    wait_time_score = (
      SELECT COALESCE(AVG(wait_time_rating), 0)
      FROM public.dentist_ratings 
      WHERE dentist_id = COALESCE(NEW.dentist_id, OLD.dentist_id)
      AND wait_time_rating IS NOT NULL
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.dentist_id, OLD.dentist_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_dentist_ratings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.dentist_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dentist_ratings();

-- Create updated_at trigger for ratings
CREATE TRIGGER update_dentist_ratings_updated_at
  BEFORE UPDATE ON public.dentist_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();