-- Helper function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE business_services
  SET stock_quantity = GREATEST(0, stock_quantity - quantity)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get stylist commission rate
CREATE OR REPLACE FUNCTION get_stylist_commission_rate(business_id_param UUID, stylist_level_param TEXT)
RETURNS TABLE (
  service_commission DECIMAL,
  product_commission DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    service_commission_percent,
    product_commission_percent
  FROM commission_rates
  WHERE business_id = business_id_param
    AND stylist_level = stylist_level_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
