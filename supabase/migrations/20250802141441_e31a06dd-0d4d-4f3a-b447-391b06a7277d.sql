-- Update notes to use the correct profile ID
UPDATE notes 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

-- Update medical records
UPDATE medical_records 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

-- Update appointments  
UPDATE appointments 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

-- Update other tables that might reference this profile
UPDATE prescriptions 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

UPDATE treatment_plans 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

UPDATE patient_documents 
SET patient_id = '2260749e-99ac-4556-96e3-5ccdc665b057' 
WHERE patient_id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';

-- Now delete the orphaned profile
DELETE FROM profiles WHERE id = 'e203af27-865a-44aa-96fb-72c3bf2822ae';