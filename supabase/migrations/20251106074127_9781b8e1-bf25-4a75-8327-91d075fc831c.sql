-- Update leave_clinic function to auto-delete business when last member leaves
CREATE OR REPLACE FUNCTION public.leave_clinic(p_business_id uuid DEFAULT get_current_business_id())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_profile_id uuid;
  v_remaining integer := 0;
  v_total_members integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_business_id is null then
    raise exception 'No business context';
  end if;

  select id into v_profile_id from public.profiles where user_id = v_user_id;
  if v_profile_id is null then
    raise exception 'Profile not found';
  end if;

  -- Count total members before removal
  select count(*) into v_total_members 
  from public.business_members
  where business_id = p_business_id;

  -- Remove membership links for this business
  delete from public.business_members
  where business_id = p_business_id and profile_id = v_profile_id;

  delete from public.provider_business_map
  where business_id = p_business_id and provider_id = v_profile_id;

  -- Check if provider still belongs to other businesses
  select count(*) into v_remaining from public.provider_business_map where provider_id = v_profile_id;

  if v_remaining = 0 then
    -- Deactivate dentist record (they are no longer practicing anywhere)
    update public.dentists set is_active = false where profile_id = v_profile_id;

    -- Remove provider role so user is only a patient
    delete from public.user_roles where user_id = v_user_id and role = 'provider'::public.app_role;
  end if;

  -- If this was the last member, delete the business entirely
  if v_total_members <= 1 then
    -- Delete related data first
    delete from public.homepage_settings where business_id = p_business_id;
    delete from public.business_services where business_id = p_business_id;
    delete from public.appointment_slots where business_id = p_business_id;
    delete from public.dentist_availability where business_id = p_business_id;
    delete from public.dentist_vacation_days where business_id = p_business_id;
    delete from public.dentist_capacity_settings where business_id = p_business_id;
    delete from public.appointment_types where business_id = p_business_id;
    delete from public.medical_records where business_id = p_business_id;
    delete from public.treatment_plans where business_id = p_business_id;
    delete from public.payment_requests where business_id = p_business_id;
    delete from public.appointments where business_id = p_business_id;
    delete from public.messages where business_id = p_business_id;
    delete from public.product_sales where business_id = p_business_id;
    delete from public.service_tips where business_id = p_business_id;
    delete from public.patient_preferences where business_id = p_business_id;
    delete from public.restaurant_staff_roles where business_id = p_business_id;
    delete from public.restaurant_staff_codes where business_id = p_business_id;
    delete from public.session_business where business_id = p_business_id;
    
    -- Delete the business itself
    delete from public.businesses where id = p_business_id;
    
    return jsonb_build_object(
      'success', true, 
      'remaining_businesses', v_remaining,
      'business_deleted', true
    );
  end if;

  return jsonb_build_object(
    'success', true, 
    'remaining_businesses', v_remaining,
    'business_deleted', false
  );
end;
$function$;