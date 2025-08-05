-- Create payment_requests table to track all payment requests
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  description TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  patient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'eur'
);

-- Enable Row Level Security
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for payment requests
CREATE POLICY "Dentists can manage their payment requests" 
ON public.payment_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM dentists d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = payment_requests.dentist_id AND p.user_id = auth.uid()
));

CREATE POLICY "Patients can view their payment requests" 
ON public.payment_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = payment_requests.patient_id AND p.user_id = auth.uid()
));

-- Create index for performance
CREATE INDEX idx_payment_requests_dentist_id ON public.payment_requests(dentist_id);
CREATE INDEX idx_payment_requests_patient_id ON public.payment_requests(patient_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();