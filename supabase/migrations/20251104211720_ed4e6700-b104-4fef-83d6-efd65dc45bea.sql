-- Add daily revenue goal column to businesses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'daily_revenue_goal_cents'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN daily_revenue_goal_cents integer DEFAULT 180000;
  END IF;
END $$;

-- Create function to calculate daily revenue
CREATE OR REPLACE FUNCTION public.get_daily_revenue(
  business_id_param uuid,
  date_param text
)
RETURNS TABLE (
  service_revenue_cents bigint,
  product_revenue_cents bigint,
  tips_cents bigint,
  total_revenue_cents bigint,
  clients_served bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_of_day timestamp with time zone;
  end_of_day timestamp with time zone;
BEGIN
  -- Convert date string to timestamp range
  start_of_day := date_param::date;
  end_of_day := start_of_day + interval '1 day';
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bs.price_cents), 0)::bigint as service_revenue_cents,
    COALESCE((
      SELECT SUM(ps.price_cents * ps.quantity)
      FROM public.product_sales ps
      WHERE ps.business_id = business_id_param
        AND ps.created_at >= start_of_day
        AND ps.created_at < end_of_day
    ), 0)::bigint as product_revenue_cents,
    COALESCE((
      SELECT SUM(st.amount_cents)
      FROM public.service_tips st
      WHERE st.business_id = business_id_param
        AND st.created_at >= start_of_day
        AND st.created_at < end_of_day
    ), 0)::bigint as tips_cents,
    (
      COALESCE(SUM(bs.price_cents), 0) +
      COALESCE((
        SELECT SUM(ps.price_cents * ps.quantity)
        FROM public.product_sales ps
        WHERE ps.business_id = business_id_param
          AND ps.created_at >= start_of_day
          AND ps.created_at < end_of_day
      ), 0) +
      COALESCE((
        SELECT SUM(st.amount_cents)
        FROM public.service_tips st
        WHERE st.business_id = business_id_param
          AND st.created_at >= start_of_day
          AND st.created_at < end_of_day
      ), 0)
    )::bigint as total_revenue_cents,
    COUNT(DISTINCT a.id)::bigint as clients_served
  FROM public.appointments a
  LEFT JOIN public.business_services bs ON bs.id = a.service_id
  WHERE a.business_id = business_id_param
    AND a.status = 'completed'
    AND a.completed_at >= start_of_day
    AND a.completed_at < end_of_day;
END;
$$;