-- Remove the orphaned profile that's not linked to any dentist
DELETE FROM profiles 
WHERE email = 'Romeojackson199@gmail.com' 
AND id NOT IN (SELECT profile_id FROM dentists WHERE profile_id IS NOT NULL);