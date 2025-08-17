-- Create recalls table for patient follow-up appointments
CREATE TABLE public.recalls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  treatment_key TEXT NOT NULL,
  treatment_label TEXT NOT NULL,
  due_date DATE NOT NULL,
  suggested_slots JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'suggested',
  booked_appointment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing clinic_address column to dentists table
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS clinic_address TEXT;

-- Enable RLS on recalls table
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recalls
CREATE POLICY "Dentists can manage their recalls" 
ON public.recalls 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = recalls.dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their recalls" 
ON public.recalls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = recalls.patient_id AND p.user_id = auth.uid()
  )
);

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  patient_amount_cents INTEGER NOT NULL DEFAULT 0,
  mutuality_amount_cents INTEGER NOT NULL DEFAULT 0,
  vat_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  claim_status TEXT NOT NULL DEFAULT 'not_submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Dentists can manage their invoices" 
ON public.invoices 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = invoices.dentist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their invoices" 
ON public.invoices 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = invoices.patient_id AND p.user_id = auth.uid()
  )
);

-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  tariff_cents INTEGER NOT NULL DEFAULT 0,
  mutuality_cents INTEGER NOT NULL DEFAULT 0,
  patient_cents INTEGER NOT NULL DEFAULT 0,
  vat_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_items table
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_items
CREATE POLICY "Dentists can manage their invoice items" 
ON public.invoice_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN dentists d ON d.id = i.dentist_id
    JOIN profiles p ON p.id = d.profile_id
    WHERE i.id = invoice_items.invoice_id AND p.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recalls_patient_id ON public.recalls(patient_id);
CREATE INDEX IF NOT EXISTS idx_recalls_dentist_id ON public.recalls(dentist_id);
CREATE INDEX IF NOT EXISTS idx_recalls_due_date ON public.recalls(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON public.invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Add update trigger for recalls
CREATE TRIGGER update_recalls_updated_at
  BEFORE UPDATE ON public.recalls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();