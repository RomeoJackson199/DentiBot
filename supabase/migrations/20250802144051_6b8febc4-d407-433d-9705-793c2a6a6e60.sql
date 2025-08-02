-- Corriger le user_id de Romeo Jackson pour correspondre à sa nouvelle session
-- Mettre à jour le profil existant avec le nouveau user_id
UPDATE profiles 
SET user_id = '13ecaf41-9be9-42ef-aad1-ae31bdbbb089',
    updated_at = now()
WHERE email = 'romeojackson199@gmail.com';

-- Vérifier et corriger aussi le dentist record si nécessaire
-- Pas de changement requis car les dentistes sont liés par profile_id, pas user_id