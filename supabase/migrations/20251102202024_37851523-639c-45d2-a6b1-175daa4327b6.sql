-- 1) Add missing custom template columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS custom_features jsonb,
  ADD COLUMN IF NOT EXISTS custom_terminology jsonb;

-- 2) Create template_change_history table used by TemplateContext.updateTemplate()
CREATE TABLE IF NOT EXISTS public.template_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_template text,
  to_template text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Enable RLS and add safe policies for members to insert/view
ALTER TABLE public.template_change_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_change_history' AND policyname = 'Business members can insert template history'
  ) THEN
    CREATE POLICY "Business members can insert template history"
    ON public.template_change_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
      is_business_member(viewer_profile_id(auth.uid()), business_id)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_change_history' AND policyname = 'Business members can view template history'
  ) THEN
    CREATE POLICY "Business members can view template history"
    ON public.template_change_history
    FOR SELECT
    TO authenticated
    USING (
      is_business_member(viewer_profile_id(auth.uid()), business_id)
    );
  END IF;
END $$;