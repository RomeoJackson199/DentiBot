-- SECURITY FIX: Safe update of RLS policies to fix critical vulnerabilities

-- First, let's see what policies exist and safely drop/recreate them
-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Public can view limited calendar info for availability" ON calendar_events;

-- Drop existing broad policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view available slots" ON appointment_slots;
DROP POLICY IF EXISTS "System can manage slots" ON appointment_slots;
DROP POLICY IF EXISTS "Authenticated users can view dentist availability" ON dentist_availability;

-- SECURITY FIX: Create secure patient policy for calendar events
-- Only create if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calendar_events' 
        AND policyname = 'Patients can view their own appointments in calendar'
    ) THEN
        CREATE POLICY "Patients can view their own appointments in calendar"
        ON calendar_events
        FOR SELECT
        TO authenticated
        USING (
          event_type = 'appointment' 
          AND appointment_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM appointments a
            JOIN profiles p ON p.id = a.patient_id
            WHERE a.id = calendar_events.appointment_id
            AND p.user_id = auth.uid()
          )
        );
    END IF;
END $$;

-- SECURITY FIX: Create secure appointment slots policies
CREATE POLICY "Users can view available appointment slots for booking"
ON appointment_slots
FOR SELECT
TO authenticated
USING (is_available = true);

CREATE POLICY "Dentists can manage appointment slots"
ON appointment_slots
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = appointment_slots.dentist_id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = appointment_slots.dentist_id 
    AND p.user_id = auth.uid()
  )
);

-- SECURITY FIX: Create secure dentist availability policy
CREATE POLICY "Users can view available dentist schedules"
ON dentist_availability
FOR SELECT
TO authenticated
USING (is_available = true);

-- SECURITY AUDIT: Log this security fix
INSERT INTO audit_logs (user_id, action, resource_type, details)
VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_policy_update',
  'multiple_tables',
  jsonb_build_object(
    'description', 'CRITICAL SECURITY FIX: Removed public access to patient appointment data and strengthened RLS policies',
    'tables_updated', ARRAY['calendar_events', 'appointment_slots', 'dentist_availability'],
    'severity', 'CRITICAL',
    'vulnerabilities_fixed', ARRAY['public_access_to_appointments', 'overly_broad_slot_access']
  )
);