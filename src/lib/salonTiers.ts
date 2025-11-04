/**
 * Salon Tier Configuration
 * Defines features and capabilities for different salon business sizes
 */

export type SalonTier = 'solo' | 'team' | 'enterprise';

export interface SalonTierConfig {
  tier: SalonTier;
  name: string;
  description: string;
  features: {
    teamStatus: boolean;           // Live team status board
    multiLocation: boolean;         // Multiple locations support
    advancedReports: boolean;       // Detailed analytics
    centralInventory: boolean;      // Central warehouse management
    networkLeaderboard: boolean;    // Cross-location leaderboard
    commissions: boolean;           // Commission tracking
    productInventory: boolean;      // Retail product tracking
    walkInManagement: boolean;      // Walk-in & waitlist
    stylistPortfolios: boolean;     // Before/after galleries
    tipsTracking: boolean;          // Tips recording
  };
  maxStylists: number | null;       // null = unlimited
  maxLocations: number;
  pricing: {
    monthly: number;                // in euros
    annual: number;                 // in euros (discounted)
  };
}

export const SALON_TIERS: Record<SalonTier, SalonTierConfig> = {
  solo: {
    tier: 'solo',
    name: 'Solo Stylist',
    description: 'Perfect for independent stylists and one-person shops',
    features: {
      teamStatus: false,
      multiLocation: false,
      advancedReports: false,
      centralInventory: false,
      networkLeaderboard: false,
      commissions: false,
      productInventory: true,
      walkInManagement: true,
      stylistPortfolios: true,
      tipsTracking: true,
    },
    maxStylists: 1,
    maxLocations: 1,
    pricing: {
      monthly: 0,     // Free
      annual: 0,
    },
  },

  team: {
    tier: 'team',
    name: 'Team Salon',
    description: 'For small salons with 2-10 stylists',
    features: {
      teamStatus: true,               // ✅ Live team coordination
      multiLocation: false,
      advancedReports: true,
      centralInventory: false,
      networkLeaderboard: false,
      commissions: true,              // ✅ Commission tracking
      productInventory: true,         // ✅ Retail products
      walkInManagement: true,         // ✅ Walk-ins & waitlist
      stylistPortfolios: true,        // ✅ Portfolio galleries
      tipsTracking: true,             // ✅ Tips tracking
    },
    maxStylists: 10,
    maxLocations: 1,
    pricing: {
      monthly: 49,
      annual: 490,    // ~2 months free
    },
  },

  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise Chain',
    description: 'For multi-location salons and franchises',
    features: {
      teamStatus: true,
      multiLocation: true,            // ✅ Multiple locations
      advancedReports: true,
      centralInventory: true,         // ✅ Central warehouse
      networkLeaderboard: true,       // ✅ Cross-location leaderboard
      commissions: true,
      productInventory: true,
      walkInManagement: true,
      stylistPortfolios: true,
      tipsTracking: true,
    },
    maxStylists: null,  // Unlimited
    maxLocations: 999,  // Unlimited
    pricing: {
      monthly: 199,
      annual: 1990,   // ~2 months free
    },
  },
};

/**
 * Get configuration for a specific tier
 */
export function getSalonTierConfig(tier: SalonTier): SalonTierConfig {
  return SALON_TIERS[tier];
}

/**
 * Check if a feature is available for a tier
 */
export function hasSalonFeature(
  tier: SalonTier,
  feature: keyof SalonTierConfig['features']
): boolean {
  return SALON_TIERS[tier].features[feature];
}

/**
 * Get all tiers for comparison
 */
export function getAllSalonTiers(): SalonTierConfig[] {
  return Object.values(SALON_TIERS);
}

/**
 * Determine recommended tier based on stylist count
 */
export function getRecommendedTier(stylistCount: number, locationCount: number = 1): SalonTier {
  if (locationCount > 1) return 'enterprise';
  if (stylistCount === 1) return 'solo';
  if (stylistCount <= 10) return 'team';
  return 'enterprise';
}

/**
 * Check if user can add more stylists
 */
export function canAddStylist(tier: SalonTier, currentCount: number): boolean {
  const config = SALON_TIERS[tier];
  if (config.maxStylists === null) return true;
  return currentCount < config.maxStylists;
}

/**
 * Format price for display
 */
export function formatTierPrice(tier: SalonTier, period: 'monthly' | 'annual' = 'monthly'): string {
  const config = SALON_TIERS[tier];
  const price = period === 'monthly' ? config.pricing.monthly : config.pricing.annual;

  if (price === 0) return 'Free';

  if (period === 'annual') {
    const monthlyEquivalent = Math.round(price / 12);
    return `€${price}/year (€${monthlyEquivalent}/mo)`;
  }

  return `€${price}/month`;
}
