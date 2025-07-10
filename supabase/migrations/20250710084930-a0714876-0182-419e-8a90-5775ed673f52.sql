-- Add availability for Virginie Pauwels (missing from earlier)
INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available, break_start_time, break_end_time)
VALUES 
  ('46067bae-18f6-4769-b8e4-be48cc18d273', 1, '07:00', '17:00', true, '12:00', '13:00'),
  ('46067bae-18f6-4769-b8e4-be48cc18d273', 2, '07:00', '17:00', true, '12:00', '13:00'),
  ('46067bae-18f6-4769-b8e4-be48cc18d273', 3, '07:00', '17:00', true, '12:00', '13:00'),
  ('46067bae-18f6-4769-b8e4-be48cc18d273', 4, '07:00', '17:00', true, '12:00', '13:00'),
  ('46067bae-18f6-4769-b8e4-be48cc18d273', 5, '07:00', '17:00', true, '12:00', '13:00')
ON CONFLICT (dentist_id, day_of_week) DO NOTHING;