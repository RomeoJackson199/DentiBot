-- Add retail product tracking columns to business_services
ALTER TABLE business_services
ADD COLUMN IF NOT EXISTS is_retail boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;

-- Create service_tips table for tracking tips
CREATE TABLE IF NOT EXISTS service_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  stylist_id uuid REFERENCES dentists(id) ON DELETE SET NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'cash')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create product_sales table for tracking retail product sales
CREATE TABLE IF NOT EXISTS product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES business_services(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_cents integer NOT NULL,
  sold_by_stylist_id uuid REFERENCES dentists(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  product_id uuid,
  quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE business_services
  SET stock_quantity = GREATEST(0, stock_quantity - quantity),
      updated_at = now()
  WHERE id = product_id;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_tips_appointment ON service_tips(appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_stylist ON service_tips(stylist_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_business ON service_tips(business_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_product ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_appointment ON product_sales(appointment_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_business ON product_sales(business_id);

-- Enable RLS
ALTER TABLE service_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_tips
CREATE POLICY "Business members can view tips"
  ON service_tips FOR SELECT
  USING (
    business_id = get_current_business_id()
    AND is_business_member((SELECT id FROM profiles WHERE user_id = auth.uid()), business_id)
  );

CREATE POLICY "Business members can insert tips"
  ON service_tips FOR INSERT
  WITH CHECK (
    business_id = get_current_business_id()
    AND is_business_member((SELECT id FROM profiles WHERE user_id = auth.uid()), business_id)
  );

-- RLS Policies for product_sales
CREATE POLICY "Business members can view product sales"
  ON product_sales FOR SELECT
  USING (
    business_id = get_current_business_id()
    AND is_business_member((SELECT id FROM profiles WHERE user_id = auth.uid()), business_id)
  );

CREATE POLICY "Business members can insert product sales"
  ON product_sales FOR INSERT
  WITH CHECK (
    business_id = get_current_business_id()
    AND is_business_member((SELECT id FROM profiles WHERE user_id = auth.uid()), business_id)
  );

-- Add comment for completed_at column on appointments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN completed_at timestamptz;
  END IF;
END $$;