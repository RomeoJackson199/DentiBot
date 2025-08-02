-- Supprimer le dentiste Romeo Jackson sans spécialisation (doublon)
-- Garder seulement celui avec "General Dentistry" et l'email romeojackson199@gmail.com

-- D'abord, vérifier s'il y a des données liées au dentiste à supprimer
-- et les transférer vers le bon dentiste si nécessaire

-- Transférer les créneaux d'appointments vers le bon dentiste
UPDATE appointment_slots 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les rendez-vous vers le bon dentiste
UPDATE appointments 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les évaluations vers le bon dentiste
UPDATE dentist_ratings 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les dossiers médicaux vers le bon dentiste
UPDATE medical_records 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les prescriptions vers le bon dentiste
UPDATE prescriptions 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les plans de traitement vers le bon dentiste
UPDATE treatment_plans 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les disponibilités vers le bon dentiste
UPDATE dentist_availability 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Transférer les événements de calendrier vers le bon dentiste
UPDATE calendar_events 
SET dentist_id = 'b8eff059-3db7-4a2b-9c7f-629a1e31b570'
WHERE dentist_id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Supprimer le dentiste en doublon (celui sans spécialisation)
DELETE FROM dentists 
WHERE id = 'f9a76cbb-0ed8-403a-83f6-d2d5d6faf98c';

-- Supprimer le profil orphelin
DELETE FROM profiles 
WHERE id = '468668ee-d899-4b8a-b3be-4f6e082fbc0a';