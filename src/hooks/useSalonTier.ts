/**
 * useSalonTier Hook
 *
 * Automatically detects salon tier based on:
 * - 1 stylist = Type A (Solo)
 * - 2+ stylists = Type B (Team)
 * - Manual override = Type C (Enterprise)
 *
 * Updates automatically when stylists are added/removed
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalonTier } from '@/lib/salonTiers';

interface SalonTierInfo {
  tier: SalonTier;
  activeStylists: number;
  activeLocations: number;
  isManualOverride: boolean;
  recommendedTier: SalonTier;
  canUpgradeToEnterprise: boolean;
}

export function useSalonTier(businessId: string | null): {
  tierInfo: SalonTierInfo | null;
  loading: boolean;
  refreshTier: () => Promise<void>;
  upgradeToEnterprise: () => Promise<void>;
  resetToAuto: () => Promise<void>;
} {
  const [tierInfo, setTierInfo] = useState<SalonTierInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTierInfo = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      // Get business info
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('salon_tier, manual_tier_override')
        .eq('id', businessId)
        .single();

      if (businessError) throw businessError;

      // Count active stylists
      const { data: stylists, error: stylistsError } = await supabase
        .from('dentists')
        .select('id')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (stylistsError) throw stylistsError;

      // Count active locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_business_id', businessId)
        .eq('is_active', true);

      // Locations table might not exist yet, so don't throw error
      const locationCount = locations?.length || 0;
      const stylistCount = stylists?.length || 0;

      // Calculate recommended tier
      let recommendedTier: SalonTier = 'solo';
      if (locationCount > 1) {
        recommendedTier = 'enterprise';
      } else if (stylistCount >= 2) {
        recommendedTier = 'team';
      } else if (stylistCount === 1) {
        recommendedTier = 'solo';
      }

      setTierInfo({
        tier: (business?.salon_tier as SalonTier) || 'solo',
        activeStylists: stylistCount,
        activeLocations: locationCount,
        isManualOverride: business?.manual_tier_override || false,
        recommendedTier,
        canUpgradeToEnterprise: stylistCount >= 2,
      });
    } catch (error) {
      console.error('Error loading tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToEnterprise = async () => {
    if (!businessId) return;

    try {
      const { error } = await supabase.rpc('upgrade_to_enterprise', {
        business_id_param: businessId,
      });

      if (error) throw error;

      // Reload tier info
      await loadTierInfo();
    } catch (error) {
      console.error('Error upgrading to enterprise:', error);
      throw error;
    }
  };

  const resetToAuto = async () => {
    if (!businessId) return;

    try {
      const { error } = await supabase.rpc('reset_to_auto_tier', {
        business_id_param: businessId,
      });

      if (error) throw error;

      // Reload tier info
      await loadTierInfo();
    } catch (error) {
      console.error('Error resetting to auto tier:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadTierInfo();

    // Set up real-time subscription to dentists table
    const channel = supabase
      .channel(`salon_tier_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dentists',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Reload tier info when stylists change
          loadTierInfo();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${businessId}`,
        },
        () => {
          // Reload tier info when business settings change
          loadTierInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  return {
    tierInfo,
    loading,
    refreshTier: loadTierInfo,
    upgradeToEnterprise,
    resetToAuto,
  };
}
