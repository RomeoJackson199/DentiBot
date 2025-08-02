-- Identifier et fusionner les profils en doublon de Romeo Jackson
-- Mettre à jour le dentist record pour pointer vers le profil avec le bon user_id

-- D'abord récupérer l'ID du profil avec le bon user_id
UPDATE dentists 
SET profile_id = (
  SELECT id FROM profiles 
  WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' 
  AND email = 'romeojackson199@gmail.com'
)
WHERE profile_id = '2260749e-99ac-4556-96e3-5ccdc665b057';

-- Transférer les données du profil obsolète vers le profil actuel
UPDATE profiles 
SET 
  date_of_birth = COALESCE(date_of_birth, (SELECT date_of_birth FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  phone = COALESCE(phone, (SELECT phone FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  medical_history = COALESCE(medical_history, (SELECT medical_history FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  preferred_language = COALESCE(preferred_language, (SELECT preferred_language FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  address = COALESCE(address, (SELECT address FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  emergency_contact = COALESCE(emergency_contact, (SELECT emergency_contact FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057')),
  updated_at = now()
WHERE user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089' 
AND email = 'romeojackson199@gmail.com';

-- Supprimer l'ancien profil orphelin
DELETE FROM profiles WHERE id = '2260749e-99ac-4556-96e3-5ccdc665b057';