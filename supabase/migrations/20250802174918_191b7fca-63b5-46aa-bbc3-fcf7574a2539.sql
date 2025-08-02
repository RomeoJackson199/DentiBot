-- Create tasks table for task & reminder board
CREATE TABLE public.dentist_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id uuid NOT NULL,
  patient_id uuid,
  appointment_id uuid,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  due_date timestamp with time zone,
  assigned_to text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create communications table for communication hub
CREATE TABLE public.communications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id uuid NOT NULL,
  patient_id uuid,
  communication_type text NOT NULL DEFAULT 'email',
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create dashboard preferences for customization
CREATE TABLE public.dashboard_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id uuid NOT NULL UNIQUE,
  layout_config jsonb DEFAULT '{}',
  widget_positions jsonb DEFAULT '[]',
  theme text DEFAULT 'light',
  notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create audit logs for security
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add patient status tracking to appointments for queue management
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS patient_status text DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS treatment_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS treatment_completed_at timestamp with time zone;

-- Enable RLS on new tables
ALTER TABLE public.dentist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dentist tasks
CREATE POLICY "Dentists can manage their own tasks"
ON public.dentist_tasks
FOR ALL
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = dentist_tasks.dentist_id AND p.user_id = auth.uid()
));

-- Create RLS policies for communications
CREATE POLICY "Dentists can manage their own communications"
ON public.communications
FOR ALL
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = communications.dentist_id AND p.user_id = auth.uid()
));

-- Create RLS policies for dashboard preferences
CREATE POLICY "Dentists can manage their own preferences"
ON public.dashboard_preferences
FOR ALL
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = dashboard_preferences.dentist_id AND p.user_id = auth.uid()
));

-- Create RLS policies for audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_dentist_tasks_updated_at
  BEFORE UPDATE ON public.dentist_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get comprehensive dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(p_dentist_id uuid)
RETURNS TABLE(
  today_appointments_count bigint,
  urgent_cases_count bigint,
  patients_waiting_count bigint,
  patients_in_treatment_count bigint,
  revenue_today numeric,
  pending_tasks_count bigint,
  unread_messages_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND DATE(appointment_date) = CURRENT_DATE 
     AND status != 'cancelled') as today_appointments_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND urgency = 'high' 
     AND appointment_date >= now() 
     AND status != 'cancelled') as urgent_cases_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'checked_in' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_waiting_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'in_treatment' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_in_treatment_count,
    
    (SELECT COALESCE(SUM(
      CASE 
        WHEN urgency = 'high' THEN 200
        WHEN urgency = 'medium' THEN 150
        ELSE 100
      END
    ), 0) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND DATE(appointment_date) = CURRENT_DATE 
     AND status = 'completed') as revenue_today,
    
    (SELECT COUNT(*) FROM dentist_tasks 
     WHERE dentist_id = p_dentist_id 
     AND status = 'open') as pending_tasks_count,
    
    (SELECT COUNT(*) FROM communications 
     WHERE dentist_id = p_dentist_id 
     AND status = 'unread') as unread_messages_count;
END;
$function$;