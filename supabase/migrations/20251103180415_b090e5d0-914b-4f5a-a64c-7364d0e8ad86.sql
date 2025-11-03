-- Ensure restaurant_tables has proper RLS policies
DROP POLICY IF EXISTS "Business members can manage tables" ON restaurant_tables;
CREATE POLICY "Business members can manage tables"
ON restaurant_tables
FOR ALL
USING (
  business_id = get_current_business_id() 
  AND is_business_member(
    (SELECT id FROM profiles WHERE user_id = auth.uid()),
    business_id
  )
);

DROP POLICY IF EXISTS "Public can view tables" ON restaurant_tables;
CREATE POLICY "Public can view tables"
ON restaurant_tables
FOR SELECT
USING (true);

-- Ensure table_reservations has business_id and proper RLS
ALTER TABLE table_reservations 
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id);

-- Backfill business_id for existing reservations
UPDATE table_reservations tr
SET business_id = a.business_id
FROM appointments a
WHERE tr.appointment_id = a.id
AND tr.business_id IS NULL;

-- Make business_id NOT NULL after backfill
ALTER TABLE table_reservations 
ALTER COLUMN business_id SET NOT NULL;

DROP POLICY IF EXISTS "Business members can manage reservations" ON table_reservations;
CREATE POLICY "Business members can manage reservations"
ON table_reservations
FOR ALL
USING (
  business_id = get_current_business_id() 
  AND is_business_member(
    (SELECT id FROM profiles WHERE user_id = auth.uid()),
    business_id
  )
);

DROP POLICY IF EXISTS "Customers can view their reservations" ON table_reservations;
CREATE POLICY "Customers can view their reservations"
ON table_reservations
FOR SELECT
USING (
  appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE p.user_id = auth.uid()
  )
);

-- Ensure restaurant_orders RLS is comprehensive
DROP POLICY IF EXISTS "Business members can manage orders" ON restaurant_orders;
CREATE POLICY "Business members can manage orders"
ON restaurant_orders
FOR ALL
USING (
  business_id = get_current_business_id() 
  AND is_business_member(
    (SELECT id FROM profiles WHERE user_id = auth.uid()),
    business_id
  )
);

DROP POLICY IF EXISTS "Customers can create orders" ON restaurant_orders;
CREATE POLICY "Customers can create orders"
ON restaurant_orders
FOR INSERT
WITH CHECK (
  reservation_id IN (
    SELECT tr.id FROM table_reservations tr
    JOIN appointments a ON a.id = tr.appointment_id
    JOIN profiles p ON p.id = a.patient_id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can update their draft orders" ON restaurant_orders;
CREATE POLICY "Customers can update their draft orders"
ON restaurant_orders
FOR UPDATE
USING (
  order_status = 'draft'
  AND reservation_id IN (
    SELECT tr.id FROM table_reservations tr
    JOIN appointments a ON a.id = tr.appointment_id
    JOIN profiles p ON p.id = a.patient_id
    WHERE p.user_id = auth.uid()
  )
);

-- Ensure order_items RLS is comprehensive
DROP POLICY IF EXISTS "Business members can manage order items" ON order_items;
CREATE POLICY "Business members can manage order items"
ON order_items
FOR ALL
USING (
  order_id IN (
    SELECT id FROM restaurant_orders
    WHERE business_id = get_current_business_id()
    AND is_business_member(
      (SELECT id FROM profiles WHERE user_id = auth.uid()),
      business_id
    )
  )
);

DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
CREATE POLICY "Customers can create order items"
ON order_items
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT ro.id FROM restaurant_orders ro
    JOIN table_reservations tr ON tr.id = ro.reservation_id
    JOIN appointments a ON a.id = tr.appointment_id
    JOIN profiles p ON p.id = a.patient_id
    WHERE p.user_id = auth.uid()
    AND ro.order_status = 'draft'
  )
);

DROP POLICY IF EXISTS "Customers can update their draft order items" ON order_items;
CREATE POLICY "Customers can update their draft order items"
ON order_items
FOR UPDATE
USING (
  order_id IN (
    SELECT ro.id FROM restaurant_orders ro
    JOIN table_reservations tr ON tr.id = ro.reservation_id
    JOIN appointments a ON a.id = tr.appointment_id
    JOIN profiles p ON p.id = a.patient_id
    WHERE p.user_id = auth.uid()
    AND ro.order_status = 'draft'
  )
);