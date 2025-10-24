-- Multi-Tenancy Migration: Add business_id and business_members
-- Step 1: Create business_members table (extends provider_business_map concept to all users)
CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'dentist', 'assistant', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, business_id)
);

CREATE INDEX idx_business_members_profile ON public.business_members(profile_id);
CREATE INDEX idx_business_members_business ON public.business_members(business_id);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Add business_id to tenant tables (appointments, medical_records, treatment_plans, payment_requests, dentist_availability, dentist_vacation_days, appointment_slots, notification_preferences, notifications)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.dentist_availability ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.dentist_vacation_days ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);
ALTER TABLE public.appointment_slots ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- Step 3: Backfill business_id for existing rows (use the first/only business)
DO $$
DECLARE
  v_business_id uuid;
BEGIN
  SELECT id INTO v_business_id FROM public.businesses LIMIT 1;
  
  IF v_business_id IS NOT NULL THEN
    UPDATE public.appointments SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.medical_records SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.treatment_plans SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.payment_requests SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.dentist_availability SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.dentist_vacation_days SET business_id = v_business_id WHERE business_id IS NULL;
    UPDATE public.appointment_slots SET business_id = v_business_id WHERE business_id IS NULL;
  END IF;
END $$;

-- Step 4: Make business_id NOT NULL after backfill
ALTER TABLE public.appointments ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.medical_records ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.treatment_plans ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.payment_requests ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.dentist_availability ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.dentist_vacation_days ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.appointment_slots ALTER COLUMN business_id SET NOT NULL;

-- Step 5: Create indexes for business_id filtering
CREATE INDEX idx_appointments_business ON public.appointments(business_id);
CREATE INDEX idx_medical_records_business ON public.medical_records(business_id);
CREATE INDEX idx_treatment_plans_business ON public.treatment_plans(business_id);
CREATE INDEX idx_payment_requests_business ON public.payment_requests(business_id);
CREATE INDEX idx_dentist_availability_business ON public.dentist_availability(business_id);
CREATE INDEX idx_dentist_vacation_days_business ON public.dentist_vacation_days(business_id);
CREATE INDEX idx_appointment_slots_business ON public.appointment_slots(business_id);

-- Step 6: Migrate existing provider_business_map to business_members
INSERT INTO public.business_members (profile_id, business_id, role)
SELECT 
  pbm.provider_id,
  pbm.business_id,
  COALESCE(pbm.role, 'dentist')
FROM public.provider_business_map pbm
ON CONFLICT (profile_id, business_id) DO NOTHING;

-- Step 7: Add business owners as members
INSERT INTO public.business_members (profile_id, business_id, role)
SELECT owner_profile_id, id, 'owner'
FROM public.businesses
WHERE owner_profile_id IS NOT NULL
ON CONFLICT (profile_id, business_id) DO UPDATE SET role = 'owner';

-- Step 8: Session business tracking (fallback for JWT)
CREATE TABLE IF NOT EXISTS public.session_business (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_business_business ON public.session_business(business_id);

ALTER TABLE public.session_business ENABLE ROW LEVEL SECURITY;

-- Step 9: Helper function to get current business from JWT or session
CREATE OR REPLACE FUNCTION public.get_current_business_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
BEGIN
  -- Try JWT claim first
  v_business_id := current_setting('request.jwt.claims', true)::json->>'current_business_id';
  
  IF v_business_id IS NULL THEN
    -- Fall back to session_business table
    SELECT business_id INTO v_business_id
    FROM public.session_business
    WHERE user_id = auth.uid();
  END IF;
  
  RETURN v_business_id;
END;
$$;

-- Step 10: Helper function to check business membership
CREATE OR REPLACE FUNCTION public.is_business_member(p_profile_id uuid, p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE profile_id = p_profile_id AND business_id = p_business_id
  );
$$;

-- Step 11: RLS Policies for business_members
CREATE POLICY "Users can view their own memberships"
  ON public.business_members FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Business owners can manage members"
  ON public.business_members FOR ALL
  USING (business_id IN (
    SELECT business_id FROM public.business_members
    WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND role IN ('owner', 'admin')
  ));

-- Step 12: RLS Policies for session_business
CREATE POLICY "Users can manage their own session"
  ON public.session_business FOR ALL
  USING (user_id = auth.uid());

-- Step 13: Update RLS policies for tenant tables to filter by business_id
-- Drop old policies and create new business-scoped ones

-- appointments
DROP POLICY IF EXISTS "Dentists can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Dentists can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can delete their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;

CREATE POLICY "Business members can view appointments"
  ON public.appointments FOR SELECT
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

CREATE POLICY "Business members can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

CREATE POLICY "Business members can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

CREATE POLICY "Business members can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

-- medical_records
DROP POLICY IF EXISTS "Dentists can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Dentists can update their medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Dentists can view their patients' medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients can view their own medical records" ON public.medical_records;

CREATE POLICY "Business members can manage medical records"
  ON public.medical_records FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

-- treatment_plans
DROP POLICY IF EXISTS "Dentists can insert their treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Dentists can update their treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Dentists can view plans for their patients" ON public.treatment_plans;
DROP POLICY IF EXISTS "Patients can view their own treatment plans" ON public.treatment_plans;

CREATE POLICY "Business members can manage treatment plans"
  ON public.treatment_plans FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

-- payment_requests
DROP POLICY IF EXISTS "Dentists can create payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Dentists can update their payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Dentists can view their payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Patients can view their own payment requests" ON public.payment_requests;

CREATE POLICY "Business members can manage payment requests"
  ON public.payment_requests FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

-- dentist_availability
DROP POLICY IF EXISTS "Anyone can view dentist availability" ON public.dentist_availability;
DROP POLICY IF EXISTS "Dentists can manage their own availability" ON public.dentist_availability;

CREATE POLICY "Business members can manage availability"
  ON public.dentist_availability FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

CREATE POLICY "Public can view availability for business"
  ON public.dentist_availability FOR SELECT
  USING (is_available = true);

-- dentist_vacation_days
DROP POLICY IF EXISTS "Anyone can view approved vacation days" ON public.dentist_vacation_days;
DROP POLICY IF EXISTS "Dentists can manage their own vacation days" ON public.dentist_vacation_days;

CREATE POLICY "Business members can manage vacation days"
  ON public.dentist_vacation_days FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

-- appointment_slots
DROP POLICY IF EXISTS "Anyone can view appointment slots" ON public.appointment_slots;
DROP POLICY IF EXISTS "Authenticated users can reserve available slots" ON public.appointment_slots;

CREATE POLICY "Business members can manage slots"
  ON public.appointment_slots FOR ALL
  USING (
    business_id = public.get_current_business_id()
    AND public.is_business_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      business_id
    )
  );

CREATE POLICY "Public can view available slots"
  ON public.appointment_slots FOR SELECT
  USING (is_available = true);

-- Step 14: Add trigger to update business_members.updated_at
CREATE TRIGGER update_business_members_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_business_updated_at
  BEFORE UPDATE ON public.session_business
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();