-- Insert sample profiles for the dentists
INSERT INTO public.profiles (first_name, last_name, email, role, user_id) VALUES
('Virginie', 'Pauwels', 'v.pauwels@firstsmile.be', 'dentist', gen_random_uuid()),
('Emeline', 'Hubin', 'e.hubin@firstsmile.be', 'dentist', gen_random_uuid()),
('Firdaws', 'Benhsain', 'f.benhsain@firstsmile.be', 'dentist', gen_random_uuid()),
('Justine', 'Peters', 'j.peters@firstsmile.be', 'dentist', gen_random_uuid()),
('Anne-Sophie', 'Haas', 'as.haas@firstsmile.be', 'dentist', gen_random_uuid());

-- Insert dentist records
INSERT INTO public.dentists (profile_id, specialization, license_number, is_active) 
SELECT 
  p.id,
  CASE 
    WHEN p.first_name = 'Virginie' AND p.last_name = 'Pauwels' THEN 'Pédodontiste'
    WHEN p.first_name = 'Emeline' AND p.last_name = 'Hubin' THEN 'Pédodontiste'
    WHEN p.first_name = 'Firdaws' AND p.last_name = 'Benhsain' THEN 'Dentiste généraliste'
    WHEN p.first_name = 'Justine' AND p.last_name = 'Peters' THEN 'Orthodontiste'
    WHEN p.first_name = 'Anne-Sophie' AND p.last_name = 'Haas' THEN 'Orthodontiste'
  END as specialization,
  'LIC-' || SUBSTRING(p.first_name FROM 1 FOR 2) || SUBSTRING(p.last_name FROM 1 FOR 2) || '2024' as license_number,
  true
FROM public.profiles p
WHERE p.role = 'dentist' AND p.email LIKE '%@firstsmile.be';