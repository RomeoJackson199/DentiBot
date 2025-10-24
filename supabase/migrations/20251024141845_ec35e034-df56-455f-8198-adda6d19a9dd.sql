-- Add patient-friendly RLS policies for appointments and appointment_slots

-- 1) Appointments: allow patients (non-business members) to INSERT their own appointment
create policy "Patients can create their own appointments"
  on public.appointments
  for insert
  to authenticated
  with check (
    (patient_id in (select p.id from public.profiles p where p.user_id = auth.uid()))
    and exists (
      select 1
      from public.dentists d
      join public.provider_business_map pb on pb.provider_id = d.profile_id
      where d.id = dentist_id
        and pb.business_id = business_id
    )
  );

-- 2) Appointments: allow patients to view their own appointments
create policy "Patients can view their own appointments"
  on public.appointments
  for select
  to authenticated
  using (
    patient_id in (select p.id from public.profiles p where p.user_id = auth.uid())
  );

-- 3) Appointment slots: allow patients to book a slot linked to their appointment
create policy "Patients can book available slots"
  on public.appointment_slots
  for update
  to authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.appointments a
      join public.profiles p on p.id = a.patient_id
      where a.id = appointment_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    appointment_id is not null
    and exists (
      select 1
      from public.appointments a
      join public.profiles p on p.id = a.patient_id
      where a.id = appointment_id
        and p.user_id = auth.uid()
        and a.business_id = appointment_slots.business_id
        and a.dentist_id = appointment_slots.dentist_id
    )
  );

-- Helpful indexes
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_appointments_dentist on public.appointments(dentist_id);
create index if not exists idx_appointments_business on public.appointments(business_id);
create index if not exists idx_slots_dentist_date on public.appointment_slots(dentist_id, slot_date);
