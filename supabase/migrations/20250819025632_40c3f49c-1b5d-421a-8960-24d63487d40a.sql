-- SECURITY FIX: Remove overly permissive public access to calendar_events
-- and implement proper access controls

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view limited calendar info for availability" ON calendar_events;

-- Create secure policies for calendar_events
-- Dentists can manage their own calendar events
CREATE POLICY "Dentists can manage their own calendar events"
ON calendar_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = calendar_events.dentist_id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = calendar_events.dentist_id 
    AND p.user_id = auth.uid()
  )
);

-- Patients can only view their own appointments
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

-- SECURITY FIX: Strengthen appointment_slots policies
-- Remove overly broad policy and replace with secure ones
DROP POLICY IF EXISTS "Authenticated users can view available slots" ON appointment_slots;

-- Only allow viewing available slots for legitimate booking purposes
CREATE POLICY "Users can view available appointment slots"
ON appointment_slots
FOR SELECT
TO authenticated
USING (is_available = true);

-- Only system/dentists can manage slots
CREATE POLICY "Dentists can manage their own appointment slots"
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

-- SECURITY FIX: Audit and strengthen dentist_availability policies
-- The current policy is too broad for non-dentists
DROP POLICY IF EXISTS "Authenticated users can view dentist availability" ON dentist_availability;

-- Allow viewing availability for booking purposes but limit sensitive data
CREATE POLICY "Users can view active dentist availability for booking"
ON dentist_availability
FOR SELECT
TO authenticated
USING (is_available = true);

-- SECURITY FIX: Remove system override policy that bypasses security
DROP POLICY IF EXISTS "System can manage slots" ON appointment_slots;

-- SECURITY AUDIT: Log this security fix
INSERT INTO audit_logs (user_id, action, resource_type, details)
VALUES (
  auth.uid(),
  'security_policy_update',
  'calendar_events',
  jsonb_build_object(
    'description', 'Fixed critical RLS policies to prevent unauthorized access to patient appointment data',
    'tables_updated', ARRAY['calendar_events', 'appointment_slots', 'dentist_availability'],
    'severity', 'CRITICAL'
  )
);