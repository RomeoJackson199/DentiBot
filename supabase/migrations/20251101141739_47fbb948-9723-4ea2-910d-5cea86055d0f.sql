-- Create function to release appointment slot when rescheduling
CREATE OR REPLACE FUNCTION public.release_appointment_slot(p_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Release any slots associated with this appointment
  UPDATE public.appointment_slots
  SET is_available = true,
      appointment_id = null,
      updated_at = now()
  WHERE appointment_id = p_appointment_id;
END;
$function$;