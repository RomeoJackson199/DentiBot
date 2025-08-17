-- Create inventory tracking system tables

-- Inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('implants', 'anesthesia', 'consumables', 'instruments', 'other')),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  sku TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory adjustments table (for tracking stock changes)
CREATE TABLE public.inventory_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'usage', 'correction', 'expired', 'damaged')),
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- Could reference appointments, treatments, etc.
  reference_type TEXT, -- 'appointment', 'treatment', 'manual', etc.
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Treatment to supply mappings (what supplies are needed for treatments)
CREATE TABLE public.treatment_supply_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_type TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_per_treatment INTEGER NOT NULL DEFAULT 1,
  is_optional BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory orders table (for tracking purchase orders)
CREATE TABLE public.inventory_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  supplier TEXT,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  total_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory order items (items within an order)
CREATE TABLE public.inventory_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.inventory_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_supply_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Dentists can manage their own inventory items" ON public.inventory_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_items.dentist_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for inventory_adjustments
CREATE POLICY "Dentists can view their inventory adjustments" ON public.inventory_adjustments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    JOIN public.dentists d ON d.id = ii.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE ii.id = inventory_adjustments.item_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Dentists can create inventory adjustments" ON public.inventory_adjustments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    JOIN public.dentists d ON d.id = ii.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE ii.id = inventory_adjustments.item_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for treatment_supply_mappings
CREATE POLICY "Dentists can manage their treatment supply mappings" ON public.treatment_supply_mappings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.inventory_items ii
    JOIN public.dentists d ON d.id = ii.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE ii.id = treatment_supply_mappings.item_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for inventory_orders
CREATE POLICY "Dentists can manage their own inventory orders" ON public.inventory_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.dentists d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE d.id = inventory_orders.dentist_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for inventory_order_items
CREATE POLICY "Dentists can manage their own inventory order items" ON public.inventory_order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.inventory_orders io
    JOIN public.dentists d ON d.id = io.dentist_id
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE io.id = inventory_order_items.order_id AND p.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_inventory_items_dentist_id ON public.inventory_items(dentist_id);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_low_stock ON public.inventory_items(dentist_id, quantity, min_threshold);
CREATE INDEX idx_inventory_adjustments_item_id ON public.inventory_adjustments(item_id);
CREATE INDEX idx_inventory_adjustments_created_at ON public.inventory_adjustments(created_at);
CREATE INDEX idx_treatment_supply_mappings_treatment_type ON public.treatment_supply_mappings(treatment_type);
CREATE INDEX idx_inventory_orders_dentist_id ON public.inventory_orders(dentist_id);
CREATE INDEX idx_inventory_order_items_order_id ON public.inventory_order_items(order_id);

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_orders_updated_at
    BEFORE UPDATE ON public.inventory_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();