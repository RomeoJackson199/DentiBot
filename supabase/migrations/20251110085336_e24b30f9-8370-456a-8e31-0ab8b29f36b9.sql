-- Add super_admin role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';