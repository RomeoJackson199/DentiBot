-- Add slug column to organizations for unique business URLs (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'slug'
  ) THEN
    ALTER TABLE organizations ADD COLUMN slug text;
  END IF;
END $$;

-- Create unique index, handling duplicates by appending numbers
DO $$
DECLARE
  org_record RECORD;
  base_slug text;
  new_slug text;
  counter integer;
BEGIN
  -- Update existing organizations to have unique slugs
  FOR org_record IN 
    SELECT id, name 
    FROM organizations 
    WHERE slug IS NULL
  LOOP
    base_slug := lower(regexp_replace(org_record.name, '[^a-z0-9]+', '-', 'gi'));
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    new_slug := base_slug;
    counter := 1;
    
    -- Check for duplicates and append counter if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = new_slug) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE organizations 
    SET slug = new_slug 
    WHERE id = org_record.id;
  END LOOP;
END $$;

-- Now add the unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_slug_key'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add constraint to ensure slug is URL-safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'slug_format'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END $$;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);