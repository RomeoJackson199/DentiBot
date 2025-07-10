-- Clean up duplicate appointments for the same time slot
-- Keep only the earliest created appointment and cancel the others
UPDATE appointments 
SET status = 'cancelled', updated_at = now()
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY dentist_id, appointment_date 
             ORDER BY created_at
           ) as rn
    FROM appointments 
    WHERE status = 'pending'
      AND appointment_date = '2025-07-11 07:00:00+00'
  ) ranked
  WHERE rn > 1
);

-- Clean up orphaned calendar events for cancelled appointments
DELETE FROM calendar_events 
WHERE appointment_id IN (
  SELECT id FROM appointments WHERE status = 'cancelled'
);