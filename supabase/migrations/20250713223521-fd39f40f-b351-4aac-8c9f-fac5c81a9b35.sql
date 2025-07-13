-- Add foreign key constraint for patient_documents.patient_id referencing profiles.id
ALTER TABLE public.patient_documents 
ADD CONSTRAINT patient_documents_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;