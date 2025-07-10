-- Generate appointment slots for ALL dentists manually
SELECT generate_daily_slots('5b7ac275-79a2-411a-bd29-baacaf2e4faf', CURRENT_DATE);
SELECT generate_daily_slots('5b7ac275-79a2-411a-bd29-baacaf2e4faf', CURRENT_DATE + 1);
SELECT generate_daily_slots('5b7ac275-79a2-411a-bd29-baacaf2e4faf', CURRENT_DATE + 2);
SELECT generate_daily_slots('5b7ac275-79a2-411a-bd29-baacaf2e4faf', CURRENT_DATE + 3);
SELECT generate_daily_slots('5b7ac275-79a2-411a-bd29-baacaf2e4faf', CURRENT_DATE + 4);

SELECT generate_daily_slots('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', CURRENT_DATE);
SELECT generate_daily_slots('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', CURRENT_DATE + 1);
SELECT generate_daily_slots('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', CURRENT_DATE + 2);
SELECT generate_daily_slots('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', CURRENT_DATE + 3);
SELECT generate_daily_slots('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', CURRENT_DATE + 4);

SELECT generate_daily_slots('e08cc7df-5455-4700-9f1b-3d12fe18cf88', CURRENT_DATE);
SELECT generate_daily_slots('e08cc7df-5455-4700-9f1b-3d12fe18cf88', CURRENT_DATE + 1);
SELECT generate_daily_slots('e08cc7df-5455-4700-9f1b-3d12fe18cf88', CURRENT_DATE + 2);
SELECT generate_daily_slots('e08cc7df-5455-4700-9f1b-3d12fe18cf88', CURRENT_DATE + 3);
SELECT generate_daily_slots('e08cc7df-5455-4700-9f1b-3d12fe18cf88', CURRENT_DATE + 4);

SELECT generate_daily_slots('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', CURRENT_DATE);
SELECT generate_daily_slots('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', CURRENT_DATE + 1);
SELECT generate_daily_slots('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', CURRENT_DATE + 2);
SELECT generate_daily_slots('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', CURRENT_DATE + 3);
SELECT generate_daily_slots('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', CURRENT_DATE + 4);

-- Create default availability for all dentists
INSERT INTO dentist_availability (dentist_id, day_of_week, start_time, end_time, is_available, break_start_time, break_end_time)
VALUES 
  -- Anne-Sophie Haas
  ('5b7ac275-79a2-411a-bd29-baacaf2e4faf', 1, '07:00', '17:00', true, '12:00', '13:00'),
  ('5b7ac275-79a2-411a-bd29-baacaf2e4faf', 2, '07:00', '17:00', true, '12:00', '13:00'),
  ('5b7ac275-79a2-411a-bd29-baacaf2e4faf', 3, '07:00', '17:00', true, '12:00', '13:00'),
  ('5b7ac275-79a2-411a-bd29-baacaf2e4faf', 4, '07:00', '17:00', true, '12:00', '13:00'),
  ('5b7ac275-79a2-411a-bd29-baacaf2e4faf', 5, '07:00', '17:00', true, '12:00', '13:00'),
  -- Emeline Hubin
  ('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', 1, '07:00', '17:00', true, '12:00', '13:00'),
  ('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', 2, '07:00', '17:00', true, '12:00', '13:00'),
  ('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', 3, '07:00', '17:00', true, '12:00', '13:00'),
  ('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', 4, '07:00', '17:00', true, '12:00', '13:00'),
  ('d1a9cec0-6d3c-4fdb-8b66-e344e8d98b9a', 5, '07:00', '17:00', true, '12:00', '13:00'),
  -- Firdaws Benhsain
  ('e08cc7df-5455-4700-9f1b-3d12fe18cf88', 1, '07:00', '17:00', true, '12:00', '13:00'),
  ('e08cc7df-5455-4700-9f1b-3d12fe18cf88', 2, '07:00', '17:00', true, '12:00', '13:00'),
  ('e08cc7df-5455-4700-9f1b-3d12fe18cf88', 3, '07:00', '17:00', true, '12:00', '13:00'),
  ('e08cc7df-5455-4700-9f1b-3d12fe18cf88', 4, '07:00', '17:00', true, '12:00', '13:00'),
  ('e08cc7df-5455-4700-9f1b-3d12fe18cf88', 5, '07:00', '17:00', true, '12:00', '13:00'),
  -- Justine Peters
  ('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', 1, '07:00', '17:00', true, '12:00', '13:00'),
  ('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', 2, '07:00', '17:00', true, '12:00', '13:00'),
  ('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', 3, '07:00', '17:00', true, '12:00', '13:00'),
  ('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', 4, '07:00', '17:00', true, '12:00', '13:00'),
  ('e3a80b4c-b98f-45f7-98bb-696cbbe4581e', 5, '07:00', '17:00', true, '12:00', '13:00')
ON CONFLICT (dentist_id, day_of_week) DO NOTHING;