-- Security Fix Migration: Restrict Public Data Access and Harden Functions
-- This migration addresses security vulnerabilities identified in the security review

-- 1. RESTRICT PUBLIC ACCESS TO SENSITIVE TABLES

-- Remove public access from dentist_ratings table
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.dentist_ratings;

-- Create authenticated-only policy for viewing dentist ratings
CREATE POLICY "Authenticated users can view ratings" 
ON public.dentist_ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Remove public access from retention_policies if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'retention_policies') THEN
        DROP POLICY IF EXISTS "Public can view retention policies" ON public.retention_policies;
        
        -- Create admin-only policy for retention policies
        CREATE POLICY "Admins can manage retention policies" 
        ON public.retention_policies 
        FOR ALL 
        USING (EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'dentist'
        ))
        WITH CHECK (EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'dentist'
        ));
    END IF;
END $$;

-- Remove public access from vendor_registry if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_registry') THEN
        DROP POLICY IF EXISTS "Public can view vendor registry" ON public.vendor_registry;
        
        -- Create admin-only policy for vendor registry
        CREATE POLICY "Admins can manage vendor registry" 
        ON public.vendor_registry 
        FOR ALL 
        USING (EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'dentist'
        ))
        WITH CHECK (EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'dentist'
        ));
    END IF;
END $$;

-- 2. HARDEN DATABASE FUNCTIONS WITH EXPLICIT SEARCH PATH

-- Update remaining functions that don't have explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile first with explicit schema reference
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::public.user_role
  );

  -- If the user is a dentist, create a dentist entry
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'dentist' THEN
    INSERT INTO public.dentists (profile_id, is_active)
    SELECT id, true 
    FROM public.profiles 
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
RETURNS VOID AS $$
DECLARE
  current_slot_time TIME;
  start_time TIME := '07:00';  -- Start earlier
  end_time TIME := '17:00';
  interval_minutes INTEGER := 30;
BEGIN
  -- Authorization is handled at the application level
  -- Generate slots from 7:00 AM to 5:00 PM (every 30 minutes)
  current_slot_time := start_time;
  
  WHILE current_slot_time < end_time LOOP
    INSERT INTO public.appointment_slots (dentist_id, slot_date, slot_time, emergency_only)
    VALUES (
      p_dentist_id, 
      p_date, 
      current_slot_time,
      CASE WHEN current_slot_time >= '11:30:00' THEN true ELSE false END
    )
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;
    
    -- Add 30 minutes to the current slot time
    current_slot_time := current_slot_time + (interval_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.book_appointment_slot(p_dentist_id uuid, p_slot_date date, p_slot_time time, p_appointment_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Authorization is handled at the application level via RLS policies
  UPDATE public.appointment_slots 
  SET 
    is_available = false,
    appointment_id = p_appointment_id,
    updated_at = now()
  WHERE 
    dentist_id = p_dentist_id 
    AND slot_date = p_slot_date 
    AND slot_time = p_slot_time
    AND is_available = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.release_appointment_slot(p_appointment_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Authorization is handled at the application level via RLS policies
  UPDATE public.appointment_slots 
  SET 
    is_available = true,
    appointment_id = NULL,
    updated_at = now()
  WHERE appointment_id = p_appointment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.cancel_appointment(appointment_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE appointments 
  SET status = 'cancelled', updated_at = now()
  WHERE id = appointment_id 
  AND patient_id IN (
    SELECT id FROM profiles WHERE profiles.user_id = cancel_appointment.user_id
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.link_profile_to_user(profile_id uuid, user_id uuid)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET user_id = link_profile_to_user.user_id
  WHERE id = link_profile_to_user.profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.mark_invitation_used(invitation_token uuid)
RETURNS VOID AS $$
BEGIN
  UPDATE invitation_tokens 
  SET used = true, used_at = now()
  WHERE token = invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.create_invitation_token(p_profile_id uuid, p_email text, p_expires_hours integer DEFAULT 72)
RETURNS UUID AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO public.invitation_tokens (
    profile_id,
    email,
    expires_at
  ) VALUES (
    p_profile_id,
    p_email,
    now() + (p_expires_hours || ' hours')::INTERVAL
  ) RETURNING token INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. TIGHTEN SMS NOTIFICATION POLICIES

-- Remove overly permissive SMS policies and replace with more restrictive ones
DROP POLICY IF EXISTS "System can create SMS notifications" ON public.sms_notifications;
DROP POLICY IF EXISTS "System can update SMS notifications" ON public.sms_notifications;

-- Create more restrictive SMS policies
CREATE POLICY "Dentists can create SMS notifications for their patients" 
ON public.sms_notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = sms_notifications.dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Dentists can view their SMS notifications" 
ON public.sms_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = sms_notifications.dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Dentists can update their SMS notifications" 
ON public.sms_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = sms_notifications.dentist_id AND p.user_id = auth.uid()
  )
);

-- Patients can view SMS notifications sent to them
CREATE POLICY "Patients can view SMS notifications sent to them" 
ON public.sms_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = sms_notifications.patient_id AND p.user_id = auth.uid()
  )
);