-- Update create_simple_appointment function to send email notifications
CREATE OR REPLACE FUNCTION public.create_simple_appointment(
  p_patient_id uuid, 
  p_dentist_id uuid, 
  p_appointment_date timestamp with time zone, 
  p_reason text DEFAULT 'Consultation'::text, 
  p_urgency urgency_level DEFAULT 'medium'::urgency_level
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_appointment_id UUID;
  patient_name TEXT;
  patient_email TEXT;
  dentist_name TEXT;
  formatted_date TEXT;
  formatted_time TEXT;
BEGIN
  -- Add authorization check - user must be the patient or the dentist
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only create appointments for yourself or your patients';
  END IF;
  
  -- Get patient details for email
  SELECT first_name || ' ' || last_name, email INTO patient_name, patient_email
  FROM profiles WHERE id = p_patient_id;
  
  -- Get dentist name for email
  SELECT 'Dr. ' || pr.first_name || ' ' || pr.last_name INTO dentist_name
  FROM dentists d
  JOIN profiles pr ON pr.id = d.profile_id
  WHERE d.id = p_dentist_id;
  
  -- Insert appointment
  INSERT INTO appointments (
    patient_id,
    dentist_id,
    appointment_date,
    reason,
    urgency,
    status,
    patient_name,
    duration_minutes
  ) VALUES (
    p_patient_id,
    p_dentist_id,
    p_appointment_date,
    p_reason,
    p_urgency,
    'confirmed'::appointment_status,
    patient_name,
    60
  ) RETURNING id INTO new_appointment_id;
  
  -- Send email notification if patient has email
  IF patient_email IS NOT NULL THEN
    -- Format date and time for email
    SELECT 
      to_char(p_appointment_date AT TIME ZONE 'UTC', 'Day, Month DD, YYYY'),
      to_char(p_appointment_date AT TIME ZONE 'UTC', 'HH12:MI AM')
    INTO formatted_date, formatted_time;
    
    -- Call the send-email-notification function
    PERFORM net.http_post(
      url := (SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT current_setting('app.settings.service_role_key', true))
      ),
      body := jsonb_build_object(
        'to', patient_email,
        'subject', 'Appointment Confirmation - ' || formatted_date || ' at ' || formatted_time,
        'message', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2D5D7B; margin-bottom: 24px;">Your Appointment is Confirmed!</h2>
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0;">Appointment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                  <td style="padding: 8px 0; color: #1e293b;">' || formatted_date || '</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                  <td style="padding: 8px 0; color: #1e293b;">' || formatted_time || '</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Dentist:</td>
                  <td style="padding: 8px 0; color: #1e293b;">' || dentist_name || '</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Reason:</td>
                  <td style="padding: 8px 0; color: #1e293b;">' || p_reason || '</td></tr>
            </table>
          </div>
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin: 0 0 12px 0;">📍 Important Notes:</h4>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li>Please arrive 10 minutes early for check-in</li>
              <li>Bring a valid ID and insurance card</li>
              <li>If you need to reschedule, please call us at least 24 hours in advance</li>
            </ul>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
            Thank you for choosing our dental practice. We look forward to seeing you soon!
          </p>
        </div>',
        'messageType', 'appointment_confirmation',
        'patientId', p_patient_id,
        'dentistId', p_dentist_id,
        'isSystemNotification', true
      )
    );
  END IF;
  
  RETURN new_appointment_id;
END;
$function$;