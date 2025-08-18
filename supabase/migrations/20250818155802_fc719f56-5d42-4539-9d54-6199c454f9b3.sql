-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  appointment_reminders BOOLEAN NOT NULL DEFAULT true,
  prescription_updates BOOLEAN NOT NULL DEFAULT true,
  treatment_plan_updates BOOLEAN NOT NULL DEFAULT true,
  emergency_alerts BOOLEAN NOT NULL DEFAULT true,
  system_notifications BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end TIME NOT NULL DEFAULT '07:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email notifications table
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  dentist_id UUID NOT NULL REFERENCES public.dentists(id),
  email_address TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('appointment_confirmation', 'appointment_reminder', 'prescription', 'emergency', 'system')),
  subject TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  resend_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for email_notifications
CREATE POLICY "Dentists can view their email notifications" 
ON public.email_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Dentists can create email notifications for their patients" 
ON public.email_notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Dentists can update their email notifications" 
ON public.email_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = dentist_id AND p.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint for user notification preferences
ALTER TABLE public.notification_preferences 
ADD CONSTRAINT unique_user_notification_preferences 
UNIQUE (user_id);