-- Create payment_requests table
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0), -- amount in cents
  description TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'failed', 'cancelled')),
  stripe_session_id TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  terms_due_in_days INTEGER DEFAULT 14,
  reminder_cadence_days INTEGER[] DEFAULT ARRAY[3, 7, 14],
  channels TEXT[] DEFAULT ARRAY['email'],
  last_reminder_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_items table for itemized billing
CREATE TABLE public.payment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_reminders table for tracking reminder emails
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
-- Patients can view their own payment requests
CREATE POLICY "Patients can view their own payment requests"
ON public.payment_requests
FOR SELECT
USING (
  patient_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Dentists can view payment requests they created
CREATE POLICY "Dentists can view their payment requests"
ON public.payment_requests
FOR SELECT
USING (
  dentist_id IN (
    SELECT d.id
    FROM public.dentists d
    JOIN public.profiles pr ON pr.id = d.profile_id
    WHERE pr.user_id = auth.uid()
  )
);

-- Dentists can create payment requests
CREATE POLICY "Dentists can create payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (
  dentist_id IN (
    SELECT d.id
    FROM public.dentists d
    JOIN public.profiles pr ON pr.id = d.profile_id
    WHERE pr.user_id = auth.uid()
  )
);

-- Dentists can update their own payment requests
CREATE POLICY "Dentists can update their payment requests"
ON public.payment_requests
FOR UPDATE
USING (
  dentist_id IN (
    SELECT d.id
    FROM public.dentists d
    JOIN public.profiles pr ON pr.id = d.profile_id
    WHERE pr.user_id = auth.uid()
  )
);

-- RLS Policies for payment_items
CREATE POLICY "Users can view payment items for their requests"
ON public.payment_items
FOR SELECT
USING (
  payment_request_id IN (
    SELECT pr.id FROM public.payment_requests pr
    WHERE pr.patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR pr.dentist_id IN (SELECT d.id FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid())
  )
);

CREATE POLICY "Dentists can insert payment items"
ON public.payment_items
FOR INSERT
WITH CHECK (
  payment_request_id IN (
    SELECT pr.id FROM public.payment_requests pr
    WHERE pr.dentist_id IN (SELECT d.id FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid())
  )
);

-- RLS Policies for payment_reminders
CREATE POLICY "Users can view reminders for their requests"
ON public.payment_reminders
FOR SELECT
USING (
  payment_request_id IN (
    SELECT pr.id FROM public.payment_requests pr
    WHERE pr.patient_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR pr.dentist_id IN (SELECT d.id FROM public.dentists d JOIN public.profiles p ON p.id = d.profile_id WHERE p.user_id = auth.uid())
  )
);

CREATE POLICY "System can insert reminders"
ON public.payment_reminders
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_payment_requests_patient_id ON public.payment_requests(patient_id);
CREATE INDEX idx_payment_requests_dentist_id ON public.payment_requests(dentist_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_items_request_id ON public.payment_items(payment_request_id);
CREATE INDEX idx_payment_reminders_request_id ON public.payment_reminders(payment_request_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();