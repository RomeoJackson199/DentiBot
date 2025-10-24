-- Add missing unique constraints for invitation acceptance

-- Ensure user_roles has a unique constraint on (user_id, role)
-- This may already exist, so we use IF NOT EXISTS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Ensure dentists has a unique constraint on profile_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dentists_profile_id_key'
  ) THEN
    ALTER TABLE public.dentists 
    ADD CONSTRAINT dentists_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- Ensure business_members has a unique constraint on (business_id, profile_id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'business_members_business_id_profile_id_key'
  ) THEN
    ALTER TABLE public.business_members 
    ADD CONSTRAINT business_members_business_id_profile_id_key UNIQUE (business_id, profile_id);
  END IF;
END $$;