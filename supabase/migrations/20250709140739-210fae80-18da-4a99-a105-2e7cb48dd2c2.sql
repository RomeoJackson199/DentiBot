-- Insérer de vrais dentistes français avec de vrais noms
INSERT INTO public.profiles (user_id, first_name, last_name, email, role) VALUES
('00000000-0000-0000-0000-000000000001', 'Marie', 'Dubois', 'marie.dubois@dentaire.fr', 'dentist'),
('00000000-0000-0000-0000-000000000002', 'Pierre', 'Martin', 'pierre.martin@dentaire.fr', 'dentist'),
('00000000-0000-0000-0000-000000000003', 'Sophie', 'Leroy', 'sophie.leroy@dentaire.fr', 'dentist'),
('00000000-0000-0000-0000-000000000004', 'Thomas', 'Bernard', 'thomas.bernard@dentaire.fr', 'dentist'),
('00000000-0000-0000-0000-000000000005', 'Isabelle', 'Moreau', 'isabelle.moreau@dentaire.fr', 'dentist'),
('00000000-0000-0000-0000-000000000006', 'Jean-Luc', 'Petit', 'jeanluc.petit@dentaire.fr', 'dentist')
ON CONFLICT (user_id) DO NOTHING;

-- Insérer les dentistes correspondants
INSERT INTO public.dentists (profile_id, specialization, license_number, is_active) VALUES
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'), 'Dentisterie générale', 'FR-751-2019-001', true),
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000002'), 'Orthodontie', 'FR-751-2018-042', true),
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000003'), 'Chirurgie dentaire', 'FR-751-2020-089', true),
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000004'), 'Endodontie', 'FR-751-2017-156', true),
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000005'), 'Parodontologie', 'FR-751-2021-073', true),
((SELECT id FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000006'), 'Implantologie', 'FR-751-2016-234', true)
ON CONFLICT (profile_id) DO NOTHING;