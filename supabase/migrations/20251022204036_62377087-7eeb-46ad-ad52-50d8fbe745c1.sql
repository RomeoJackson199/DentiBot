-- Create dentist_availability table for managing dentist working hours
CREATE TABLE IF NOT EXISTS public.dentist_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  break_start_time TIME,
  break_end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dentist_id, day_of_week)
);

-- Create dentist_vacation_days table for managing dentist vacations
CREATE TABLE IF NOT EXISTS public.dentist_vacation_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  vacation_type TEXT NOT NULL DEFAULT 'vacation',
  reason TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.dentist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentist_vacation_days ENABLE ROW LEVEL SECURITY;

-- RLS policies for dentist_availability
CREATE POLICY "Anyone can view dentist availability"
  ON public.dentist_availability FOR SELECT
  USING (true);

CREATE POLICY "Dentists can manage their own availability"
  ON public.dentist_availability FOR ALL
  USING (dentist_id IN (
    SELECT d.id FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  ));

-- RLS policies for dentist_vacation_days
CREATE POLICY "Anyone can view approved vacation days"
  ON public.dentist_vacation_days FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Dentists can manage their own vacation days"
  ON public.dentist_vacation_days FOR ALL
  USING (dentist_id IN (
    SELECT d.id FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dentist_availability_dentist_day 
  ON public.dentist_availability(dentist_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_vacation_days_dentist_dates 
  ON public.dentist_vacation_days(dentist_id, start_date, end_date);

-- Insert default availability for all existing dentists (Mon-Fri, 9-5)
INSERT INTO public.dentist_availability (dentist_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_available)
SELECT 
  d.id,
  day_num,
  '09:00:00'::TIME,
  '17:00:00'::TIME,
  '12:00:00'::TIME,
  '13:00:00'::TIME,
  CASE WHEN day_num BETWEEN 1 AND 5 THEN true ELSE false END
FROM public.dentists d
CROSS JOIN generate_series(0, 6) AS day_num
ON CONFLICT (dentist_id, day_of_week) DO NOTHING;