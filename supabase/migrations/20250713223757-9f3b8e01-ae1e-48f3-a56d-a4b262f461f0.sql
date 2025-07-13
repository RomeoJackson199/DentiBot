-- Create RLS policy to allow authenticated users to insert their own patient documents
CREATE POLICY "Users can insert their own patient documents" 
ON public.patient_documents 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = patient_documents.patient_id
  )
);