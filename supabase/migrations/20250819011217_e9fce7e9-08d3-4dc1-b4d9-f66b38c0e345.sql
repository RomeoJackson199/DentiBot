-- Phase 1: Fix Critical Public Data Exposure (Handle existing policies)

-- 1. Drop the overly permissive profile policy that allows public access
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON public.profiles;

-- 2. Drop existing policies to recreate them securely
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Dentists can view their patients' profiles" ON public.profiles;

-- Create secure profile access policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Dentists can view scheduled patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM appointments a 
    JOIN dentists d ON d.id = a.dentist_id 
    JOIN profiles dp ON dp.id = d.profile_id 
    WHERE a.patient_id = profiles.id 
    AND dp.user_id = auth.uid()
    AND a.appointment_date >= now() - interval '30 days'
  )
);

-- 3. Secure appointment slots - require authentication
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Authenticated users can view available slots" ON public.appointment_slots;

CREATE POLICY "Authenticated users can view available slots" 
ON public.appointment_slots 
FOR SELECT 
USING (is_available = true AND auth.uid() IS NOT NULL);

-- 4. Secure dentist availability - require authentication  
DROP POLICY IF EXISTS "Anyone can view dentist availability" ON public.dentist_availability;
DROP POLICY IF EXISTS "Authenticated users can view dentist availability" ON public.dentist_availability;

CREATE POLICY "Authenticated users can view dentist availability" 
ON public.dentist_availability 
FOR SELECT 
USING (is_available = true AND auth.uid() IS NOT NULL);

-- 5. Secure dentist profiles - only show essential info for authenticated users
DROP POLICY IF EXISTS "Anyone can view active dentists" ON public.dentists;
DROP POLICY IF EXISTS "Authenticated users can view active dentists for booking" ON public.dentists;

CREATE POLICY "Authenticated users can view active dentists for booking" 
ON public.dentists 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- 6. Add audit logging table (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_log') THEN
        CREATE TABLE public.security_audit_log (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id),
          action text NOT NULL,
          resource_type text NOT NULL,
          resource_id uuid,
          ip_address inet,
          user_agent text,
          created_at timestamp with time zone DEFAULT now()
        );

        -- Enable RLS on audit log
        ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

        -- Only allow system to insert audit logs
        CREATE POLICY "System can insert audit logs" 
        ON public.security_audit_log 
        FOR INSERT 
        WITH CHECK (true);

        -- Only allow users to view their own audit logs
        CREATE POLICY "Users can view their own audit logs" 
        ON public.security_audit_log 
        FOR SELECT 
        USING (user_id = auth.uid());
    END IF;
END $$;