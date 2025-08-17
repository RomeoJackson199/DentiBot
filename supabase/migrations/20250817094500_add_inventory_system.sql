-- Inventory System Migration
-- 1) Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_category') THEN
        CREATE TYPE public.inventory_category AS ENUM ('implants','anesthesia','consumables','instruments','other');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_adjustment_type') THEN
        CREATE TYPE public.inventory_adjustment_type AS ENUM ('increase','decrease','usage','correction','auto');
    END IF;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category public.inventory_category NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_threshold INTEGER NOT NULL DEFAULT 0 CHECK (min_threshold >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dentist_id, name)
);

CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    change INTEGER NOT NULL CHECK (change <> 0),
    adjustment_type public.inventory_adjustment_type NOT NULL,
    reason TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treatment_supply_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
    treatment_type_id UUID NOT NULL REFERENCES public.treatment_types(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dentist_id, treatment_type_id, item_id)
);

-- 3) Triggers to update updated_at on items
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER set_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_supply_mappings ENABLE ROW LEVEL SECURITY;

-- Policies: inventory_items
DROP POLICY IF EXISTS "Dentists manage own inventory items" ON public.inventory_items;
CREATE POLICY "Dentists manage own inventory items"
ON public.inventory_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_items.dentist_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_items.dentist_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage inventory items" ON public.inventory_items;
CREATE POLICY "Admins manage inventory items"
ON public.inventory_items
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Policies: inventory_adjustments
DROP POLICY IF EXISTS "Dentists manage own inventory adjustments" ON public.inventory_adjustments;
CREATE POLICY "Dentists manage own inventory adjustments"
ON public.inventory_adjustments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_adjustments.dentist_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_adjustments.dentist_id AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p2 WHERE p2.id = inventory_adjustments.created_by AND p2.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage inventory adjustments" ON public.inventory_adjustments;
CREATE POLICY "Admins manage inventory adjustments"
ON public.inventory_adjustments
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Policies: treatment_types (read for all authenticated, write only admin)
DROP POLICY IF EXISTS "Read treatment types" ON public.treatment_types;
CREATE POLICY "Read treatment types"
ON public.treatment_types
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage treatment types" ON public.treatment_types;
CREATE POLICY "Admins manage treatment types"
ON public.treatment_types
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Policies: treatment_supply_mappings (scoped per dentist)
DROP POLICY IF EXISTS "Dentists manage own treatment mappings" ON public.treatment_supply_mappings;
CREATE POLICY "Dentists manage own treatment mappings"
ON public.treatment_supply_mappings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = treatment_supply_mappings.dentist_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = treatment_supply_mappings.dentist_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage treatment mappings" ON public.treatment_supply_mappings;
CREATE POLICY "Admins manage treatment mappings"
ON public.treatment_supply_mappings
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- 5) Seed default treatment types
INSERT INTO public.treatment_types (name)
VALUES
  ('Cleaning'),
  ('Filling'),
  ('Root canal'),
  ('Implant'),
  ('Extraction'),
  ('Orthodontics (braces adjustment)'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_dentist ON public.inventory_items (dentist_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_dentist ON public.inventory_adjustments (dentist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_treatment_mappings_dentist ON public.treatment_supply_mappings (dentist_id, treatment_type_id);