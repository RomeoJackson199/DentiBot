-- Add some sample medical records to fix empty patient dossiers
INSERT INTO profiles (id, user_id, email, first_name, last_name, role, medical_history) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'patient1@example.com', 'Jean', 'Dupont', 'patient', 'Allergic to penicillin, previous dental work 2 years ago'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'patient2@example.com', 'Marie', 'Martin', 'patient', 'No known allergies, regular cleanings'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'patient3@example.com', 'Pierre', 'Moreau', 'patient', 'History of gingivitis, sensitive teeth')
ON CONFLICT (id) DO UPDATE SET
  medical_history = EXCLUDED.medical_history,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Add medical records for these patients
INSERT INTO medical_records (id, patient_id, dentist_id, title, description, findings, recommendations, visit_date, record_type) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM dentists LIMIT 1), 'Routine Cleaning', 'Regular dental cleaning and examination', 'Good oral hygiene, minor plaque buildup', 'Continue regular brushing and flossing, schedule next cleaning in 6 months', '2024-01-15', 'consultation'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM dentists LIMIT 1), 'Cavity Treatment', 'Small cavity found in upper molar', 'Small carious lesion in tooth #14', 'Filled with composite resin, avoid hard foods for 24 hours', '2024-02-20', 'treatment'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM dentists LIMIT 1), 'Consultation for Pain', 'Patient complained of tooth sensitivity', 'Sensitivity to cold foods and drinks', 'Prescribed sensitive teeth toothpaste, follow up in 2 weeks', '2024-03-10', 'consultation');

-- Add some appointments for these patients
INSERT INTO appointments (id, patient_id, dentist_id, appointment_date, reason, status, urgency, patient_name) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM dentists LIMIT 1), '2024-08-05 10:00:00+00', 'Douleur dentaire persistante', 'completed', 'medium', 'Jean Dupont'),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM dentists LIMIT 1), '2024-08-10 14:00:00+00', 'Contrôle de routine', 'confirmed', 'low', 'Marie Martin'),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM dentists LIMIT 1), '2024-08-15 09:30:00+00', 'Consultation esthétique', 'confirmed', 'low', 'Pierre Moreau');

-- Add some notes
INSERT INTO notes (id, patient_id, dentist_id, content) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM dentists LIMIT 1), 'Patient reports improvement in pain after treatment. Continue current care plan.'),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM dentists LIMIT 1), 'Excellent oral hygiene. Patient very compliant with recommendations.');

-- Update appointment reason to use symptom summaries for some appointments
UPDATE appointments SET reason = 'Douleur dentaire aiguë avec sensibilité au froid' WHERE id = '750e8400-e29b-41d4-a716-446655440001';
UPDATE appointments SET reason = 'Examen de routine - patient préventif' WHERE id = '750e8400-e29b-41d4-a716-446655440002';