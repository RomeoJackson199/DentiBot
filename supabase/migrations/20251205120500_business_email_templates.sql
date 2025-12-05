-- Create business_email_templates table for customizable email templates
CREATE TABLE IF NOT EXISTS business_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, template_type)
);

-- Add comment for documentation
COMMENT ON TABLE business_email_templates IS 'Custom email templates per business for appointment confirmations, reminders, etc.';
COMMENT ON COLUMN business_email_templates.template_type IS 'Type of email: appointment_confirmation, appointment_reminder, appointment_cancelled, 2fa_code, password_change, payment_received, payment_reminder';

-- Enable RLS
ALTER TABLE business_email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can manage their templates
CREATE POLICY "Business owners can manage email templates"
  ON business_email_templates
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE owner_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_business_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_email_templates_timestamp
  BEFORE UPDATE ON business_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_business_email_templates_updated_at();

-- Insert default templates for existing businesses (optional - they can customize later)
-- This is commented out as we'll use code defaults when no custom template exists
