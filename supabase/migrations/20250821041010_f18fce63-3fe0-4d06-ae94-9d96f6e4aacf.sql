-- Security Fix Migration: Restrict Public Data Access and Harden Functions (Corrected)
-- This migration addresses security vulnerabilities identified in the security review

-- 1. RESTRICT PUBLIC ACCESS TO SENSITIVE TABLES

-- Remove public access from dentist_ratings table
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.dentist_ratings;

-- Create authenticated-only policy for viewing dentist ratings
CREATE POLICY "Authenticated users can view ratings" 
ON public.dentist_ratings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Handle retention_policies table policies more carefully
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'retention_policies') THEN
        -- Drop any existing policies first
        DROP POLICY IF EXISTS "Public can view retention policies" ON public.retention_policies;
        DROP POLICY IF EXISTS "Admins can manage retention policies" ON public.retention_policies;
        
        -- Create admin-only policy for retention policies
        CREATE POLICY "Dentists can manage retention policies" 
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

-- Handle vendor_registry table policies more carefully
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_registry') THEN
        -- Drop any existing policies first
        DROP POLICY IF EXISTS "Public can view vendor registry" ON public.vendor_registry;
        DROP POLICY IF EXISTS "Admins can manage vendor registry" ON public.vendor_registry;
        DROP POLICY IF EXISTS "Dentists can manage vendor registry" ON public.vendor_registry;
        
        -- Create admin-only policy for vendor registry
        CREATE POLICY "Dentists can manage vendor registry" 
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

-- Update other functions with search_path
CREATE OR REPLACE FUNCTION public.book_appointment_slot(p_dentist_id uuid, p_slot_date date, p_slot_time time, p_appointment_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
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
  UPDATE public.appointment_slots 
  SET 
    is_available = true,
    appointment_id = NULL,
    updated_at = now()
  WHERE appointment_id = p_appointment_id;
  
  RETURN FOUND;
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