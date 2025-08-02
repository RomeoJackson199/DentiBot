-- Corriger Romeo Jackson en transférant toutes les données vers le bon profil
-- D'abord obtenir les IDs des profils
WITH profile_ids AS (
  SELECT 
    (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com') as new_profile_id,
    '2260749e-99ac-4556-96e3-5ccdc665b057'::uuid as old_profile_id
)

-- Transférer toutes les données liées vers le nouveau profil
-- Notes
UPDATE notes 
SET patient_id = (SELECT new_profile_id FROM profile_ids)
WHERE patient_id = (SELECT old_profile_id FROM profile_ids);

-- Mettre à jour avec les autres tables
UPDATE medical_records 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

UPDATE appointments 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

UPDATE prescriptions 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

UPDATE treatment_plans 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

UPDATE patient_documents 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

UPDATE dentist_ratings 
SET patient_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

-- Mettre à jour le dentist record pour pointer vers le bon profil
UPDATE dentists 
SET profile_id = (SELECT id FROM profiles WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' AND email = 'romeojackson199@gmail.com')
WHERE profile_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

-- Maintenant supprimer l'ancien profil
DELETE FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057';