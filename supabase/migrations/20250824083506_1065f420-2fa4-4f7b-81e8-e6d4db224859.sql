-- Insert a test profile that can be claimed
INSERT INTO profiles (email, first_name, last_name, role, profile_completion_status, created_at, updated_at)
VALUES (
  'test@example.com',
  'Test',
  'User',
  'patient',
  'incomplete',
  now(),
  now()
);

-- Insert another test profile
INSERT INTO profiles (email, first_name, last_name, role, profile_completion_status, created_at, updated_at)  
VALUES (
  'patient@demo.com',
  'Demo',
  'Patient',
  'patient', 
  'incomplete',
  now(),
  now()
);