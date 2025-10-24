-- Allow business members to view patient profiles in their clinic
-- This is read-only access for clinical reference

CREATE POLICY "Business members can view clinic patients"
ON public.profiles
FOR SELECT
USING (
  -- Check if the viewing user is a business member
  EXISTS (
    SELECT 1 FROM public.business_members bm
    JOIN public.profiles p ON p.id = bm.profile_id
    WHERE p.user_id = auth.uid()
      AND bm.business_id = get_current_business_id()
  )
  -- AND the profile being viewed has had appointments in this business
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.patient_id = profiles.id
      AND a.business_id = get_current_business_id()
  )
);

-- Note: Treatment plans and medical records already have business member access
-- via their existing "Business members can manage" policies which check:
-- business_id = get_current_business_id() AND is_business_member(...)

-- Add read-only policy for appointments so dentists can see other dentists' appointments
CREATE POLICY "Business members can view all clinic appointments"
ON public.appointments
FOR SELECT
USING (
  business_id = get_current_business_id() 
  AND is_business_member(
    (SELECT id FROM profiles WHERE user_id = auth.uid()), 
    business_id
  )
);

-- Already exists, but ensure it's clear: treatment plans are viewable by all business members
COMMENT ON POLICY "Business members can manage treatment plans" ON public.treatment_plans IS 
'Business members can view and manage all treatment plans in their clinic';

-- Already exists: medical records are viewable by all business members
COMMENT ON POLICY "Business members can manage medical records" ON public.medical_records IS 
'Business members can view and manage all medical records in their clinic';