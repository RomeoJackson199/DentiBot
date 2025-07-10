-- Remove Google Calendar integration columns from dentists table
ALTER TABLE dentists 
DROP COLUMN IF EXISTS google_calendar_tokens,
DROP COLUMN IF EXISTS google_calendar_connected;

-- Create calendar events table (per dentist)
CREATE TABLE public.calendar_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
    appointment_id UUID NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'appointment' CHECK (event_type IN ('appointment', 'blocked_time', 'break', 'personal')),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dentist availability table (enhanced version of dentist_schedules)
CREATE TABLE public.dentist_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    break_start_time TIME WITHOUT TIME ZONE,
    break_end_time TIME WITHOUT TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(dentist_id, day_of_week)
);

-- Enable RLS on calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_events (per dentist)
CREATE POLICY "Dentists can manage their own calendar events" 
ON public.calendar_events 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.dentists d 
        JOIN public.profiles p ON p.id = d.profile_id 
        WHERE d.id = calendar_events.dentist_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view calendar events for availability" 
ON public.calendar_events 
FOR SELECT 
USING (true);

-- Enable RLS on dentist_availability
ALTER TABLE public.dentist_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for dentist_availability (per dentist)
CREATE POLICY "Dentists can manage their own availability" 
ON public.dentist_availability 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.dentists d 
        JOIN public.profiles p ON p.id = d.profile_id 
        WHERE d.id = dentist_availability.dentist_id 
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view dentist availability" 
ON public.dentist_availability 
FOR SELECT 
USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dentist_availability_updated_at
BEFORE UPDATE ON public.dentist_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_dentist_id ON public.calendar_events(dentist_id);
CREATE INDEX idx_calendar_events_datetime ON public.calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_appointment_id ON public.calendar_events(appointment_id);
CREATE INDEX idx_dentist_availability_dentist_id ON public.dentist_availability(dentist_id);
CREATE INDEX idx_dentist_availability_day ON public.dentist_availability(day_of_week);