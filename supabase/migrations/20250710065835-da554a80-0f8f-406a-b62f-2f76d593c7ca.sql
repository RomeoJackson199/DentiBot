-- Temporarily drop the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Insert sample profiles for the dentists
INSERT INTO public.profiles (id, first_name, last_name, email, role, user_id) VALUES
('11111111-1111-1111-1111-111111111111', 'Virginie', 'Pauwels', 'v.pauwels@firstsmile.be', 'dentist', '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'Emeline', 'Hubin', 'e.hubin@firstsmile.be', 'dentist', '22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333333', 'Firdaws', 'Benhsain', 'f.benhsain@firstsmile.be', 'dentist', '33333333-3333-3333-3333-333333333333'),
('44444444-4444-4444-4444-444444444444', 'Justine', 'Peters', 'j.peters@firstsmile.be', 'dentist', '44444444-4444-4444-4444-444444444444'),
('55555555-5555-5555-5555-555555555555', 'Anne-Sophie', 'Haas', 'as.haas@firstsmile.be', 'dentist', '55555555-5555-5555-5555-555555555555');

-- Insert dentist records
INSERT INTO public.dentists (profile_id, specialization, license_number, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Pédodontiste', 'LIC-VP2024', true),
('22222222-2222-2222-2222-222222222222', 'Pédodontiste', 'LIC-EH2024', true),
('33333333-3333-3333-3333-333333333333', 'Dentiste généraliste', 'LIC-FB2024', true),
('44444444-4444-4444-4444-444444444444', 'Orthodontiste', 'LIC-JP2024', true),
('55555555-5555-5555-5555-555555555555', 'Orthodontiste', 'LIC-AH2024', true);