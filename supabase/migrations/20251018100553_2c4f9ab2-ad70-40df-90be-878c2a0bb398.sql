-- Retry: purge public schema with corrected function drop
DO $$
DECLARE r record;
BEGIN
  -- Drop views first
  FOR r IN (
    SELECT 'DROP VIEW IF EXISTS ' || quote_ident(schemaname) || '.' || quote_ident(viewname) || ' CASCADE;' AS stmt
    FROM pg_views
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE r.stmt;
  END LOOP;

  -- Drop tables
  FOR r IN (
    SELECT 'DROP TABLE IF EXISTS ' || quote_ident(schemaname) || '.' || quote_ident(tablename) || ' CASCADE;' AS stmt
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE r.stmt;
  END LOOP;

  -- Drop sequences
  FOR r IN (
    SELECT 'DROP SEQUENCE IF EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' CASCADE;' AS stmt
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S'
  ) LOOP
    EXECUTE r.stmt;
  END LOOP;

  -- Drop functions (all overloads)
  FOR r IN (
    SELECT 'DROP FUNCTION IF EXISTS ' || (p.oid)::regprocedure || ' CASCADE;' AS stmt
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  ) LOOP
    EXECUTE r.stmt;
  END LOOP;

  -- Drop types (enums, composite, domains)
  FOR r IN (
    SELECT 'DROP TYPE IF EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(t.typname) || ' CASCADE;' AS stmt
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype IN ('e','c','d')
  ) LOOP
    EXECUTE r.stmt;
  END LOOP;
END $$;