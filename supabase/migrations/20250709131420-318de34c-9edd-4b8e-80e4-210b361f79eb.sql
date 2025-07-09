-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create better RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Allow profile creation during signup (more permissive for INSERT)
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Add policies for other tables
CREATE POLICY "Users can view their own assessments" ON public.urgency_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON p.id = a.patient_id
      WHERE a.id = urgency_assessments.appointment_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Dentists can view schedules" ON public.dentist_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.dentists d
      JOIN public.profiles p ON p.id = d.profile_id
      WHERE d.id = dentist_schedules.dentist_id
      AND p.user_id = auth.uid()
    )
  );

-- Allow everyone to view dentist schedules for booking
CREATE POLICY "Anyone can view available schedules" ON public.dentist_schedules
  FOR SELECT USING (is_available = true);

-- Allow everyone to view dentist information for booking
CREATE POLICY "Anyone can view active dentists" ON public.dentists
  FOR SELECT USING (is_active = true);