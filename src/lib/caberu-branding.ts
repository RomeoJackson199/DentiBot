/**
 * Caberu Brand Assets
 * Centralized constants for Caberu logo URLs from Supabase Storage
 */

import { SUPABASE_URL } from "@/integrations/supabase/client";

/**
 * Caberu logo URLs from Supabase public storage
 */
export const CABERU_LOGOS = {
  /** Full logo with "Caberu Healthcare Solutions" text */
  full: `${SUPABASE_URL}/storage/v1/object/public/company-logos/caberu-logo-full.png`,

  /** Icon/mark only (the "C" tooth shape) */
  icon: `${SUPABASE_URL}/storage/v1/object/public/company-logos/caberu-logo-icon.png`,
} as const;

/**
 * Helper function to get the appropriate logo URL
 */
export function getCaberuLogo(variant: "full" | "icon" = "full"): string {
  return CABERU_LOGOS[variant];
}
