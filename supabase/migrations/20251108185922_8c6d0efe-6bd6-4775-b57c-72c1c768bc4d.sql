
-- Create table for AI knowledge base documents
CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Policies for ai_knowledge_documents - allow business owners to manage documents
CREATE POLICY "Business owners can view their AI documents"
  ON public.ai_knowledge_documents
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Business owners can insert AI documents"
  ON public.ai_knowledge_documents
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Business owners can update their AI documents"
  ON public.ai_knowledge_documents
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Business owners can delete their AI documents"
  ON public.ai_knowledge_documents
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses
      WHERE owner_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for AI knowledge documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-knowledge-documents', 'ai-knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload AI knowledge documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-knowledge-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view their AI knowledge documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'ai-knowledge-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete their AI knowledge documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ai-knowledge-documents' AND
    auth.uid() IS NOT NULL
  );

-- Create indexes for better query performance
CREATE INDEX idx_ai_knowledge_documents_business_id ON public.ai_knowledge_documents(business_id);
CREATE INDEX idx_ai_knowledge_documents_status ON public.ai_knowledge_documents(status);
