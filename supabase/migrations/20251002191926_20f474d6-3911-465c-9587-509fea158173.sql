-- Add validation to prevent marking future appointments as completed
CREATE OR REPLACE FUNCTION public.validate_appointment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent marking future appointments as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.appointment_date > now() THEN
      RAISE EXCEPTION 'Cannot mark future appointments as completed. Appointment date: %', NEW.appointment_date;
    END IF;
    
    -- Set completion timestamp
    NEW.treatment_completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_appointment_completion ON public.appointments;

CREATE TRIGGER trigger_validate_appointment_completion
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_completion();

-- Add clinic settings table for currency and other preferences
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'CAD', 'AUD')),
  business_hours_start TIME NOT NULL DEFAULT '08:00',
  business_hours_end TIME NOT NULL DEFAULT '18:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dentist_id)
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can manage their clinic settings"
ON public.clinic_settings
FOR ALL
USING (public.current_user_is_dentist_for(dentist_id));

-- Add inventory usage tracking
CREATE TABLE IF NOT EXISTS public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can manage inventory usage"
ON public.inventory_usage
FOR ALL
USING (EXISTS (
  SELECT 1 FROM inventory_items ii
  JOIN dentists d ON d.id = ii.dentist_id
  JOIN profiles p ON p.id = d.profile_id
  WHERE ii.id = inventory_usage.item_id AND p.user_id = auth.uid()
));

-- Trigger to auto-update inventory when usage is recorded
CREATE OR REPLACE FUNCTION public.update_inventory_on_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease inventory quantity
  UPDATE inventory_items
  SET quantity = quantity - NEW.quantity_used,
      updated_at = now()
  WHERE id = NEW.item_id;
  
  -- Create adjustment record
  INSERT INTO inventory_adjustments (
    item_id,
    adjustment_type,
    quantity_change,
    reason,
    reference_type,
    reference_id,
    created_by
  ) VALUES (
    NEW.item_id,
    'usage',
    -NEW.quantity_used,
    'Used in treatment',
    CASE 
      WHEN NEW.appointment_id IS NOT NULL THEN 'appointment'
      WHEN NEW.treatment_plan_id IS NOT NULL THEN 'treatment_plan'
      ELSE 'manual'
    END,
    COALESCE(NEW.appointment_id, NEW.treatment_plan_id),
    NEW.used_by
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_inventory_on_usage
AFTER INSERT ON public.inventory_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_on_usage();

-- Add patient context function for AI assistant
CREATE OR REPLACE FUNCTION public.get_patient_context_for_ai(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB := '{}';
  patient_info JSONB;
  appointments_info JSONB;
  medical_records_info JSONB;
  prescriptions_info JSONB;
  payment_info JSONB;
  balance_info JSONB;
BEGIN
  -- Authorization check
  IF NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = p_patient_id AND p.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    JOIN appointments a ON a.dentist_id = d.id
    WHERE a.patient_id = p_patient_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to patient data';
  END IF;
  
  -- Get patient profile
  SELECT to_jsonb(profiles) INTO patient_info
  FROM profiles
  WHERE id = p_patient_id;
  
  -- Get upcoming appointments
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'date', a.appointment_date,
      'reason', a.reason,
      'status', a.status,
      'dentist_name', CONCAT(p.first_name, ' ', p.last_name)
    )
  ) INTO appointments_info
  FROM appointments a
  JOIN dentists d ON d.id = a.dentist_id
  JOIN profiles p ON p.id = d.profile_id
  WHERE a.patient_id = p_patient_id
    AND a.appointment_date >= now()
    AND a.status != 'cancelled'
  ORDER BY a.appointment_date ASC;
  
  -- Get recent medical records
  SELECT jsonb_agg(to_jsonb(medical_records)) INTO medical_records_info
  FROM medical_records
  WHERE patient_id = p_patient_id
  ORDER BY record_date DESC
  LIMIT 5;
  
  -- Get active prescriptions
  SELECT jsonb_agg(
    jsonb_build_object(
      'medication', medication_name,
      'dosage', dosage,
      'instructions', instructions,
      'prescribed_date', prescribed_date
    )
  ) INTO prescriptions_info
  FROM prescriptions
  WHERE patient_id = p_patient_id
    AND (expiry_date IS NULL OR expiry_date > now())
  ORDER BY prescribed_date DESC;
  
  -- Get payment history
  SELECT jsonb_agg(
    jsonb_build_object(
      'amount', amount,
      'date', payment_date,
      'method', payment_method,
      'status', payment_status
    )
  ) INTO payment_info
  FROM payment_records
  WHERE patient_id = p_patient_id
  ORDER BY payment_date DESC
  LIMIT 10;
  
  -- Calculate outstanding balance
  SELECT jsonb_build_object(
    'total_billed', COALESCE(SUM(pr.amount), 0),
    'total_paid', COALESCE((
      SELECT SUM(amount) 
      FROM payment_records 
      WHERE patient_id = p_patient_id 
      AND payment_status = 'completed'
    ), 0),
    'outstanding', COALESCE(SUM(pr.amount), 0) - COALESCE((
      SELECT SUM(amount) 
      FROM payment_records 
      WHERE patient_id = p_patient_id 
      AND payment_status = 'completed'
    ), 0)
  ) INTO balance_info
  FROM payment_requests pr
  WHERE pr.patient_id = p_patient_id
    AND pr.status IN ('pending', 'overdue');
  
  -- Build result
  result := jsonb_build_object(
    'patient', patient_info,
    'next_appointment', COALESCE(appointments_info->0, 'null'::jsonb),
    'upcoming_appointments', COALESCE(appointments_info, '[]'::jsonb),
    'medical_records', COALESCE(medical_records_info, '[]'::jsonb),
    'active_prescriptions', COALESCE(prescriptions_info, '[]'::jsonb),
    'recent_payments', COALESCE(payment_info, '[]'::jsonb),
    'balance', balance_info
  );
  
  RETURN result;
END;
$$;