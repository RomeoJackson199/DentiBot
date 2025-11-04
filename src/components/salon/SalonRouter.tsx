/**
 * Salon Router - Automatic Dashboard Selection
 *
 * Automatically shows the right dashboard based on salon tier:
 * - 1 stylist → SoloDashboard (Type A)
 * - 2-10 stylists → SalonDashboard (Type B)
 * - Enterprise → NetworkDashboard (Type C)
 *
 * No manual configuration needed - it just works!
 */

import { useSalonTier } from '@/hooks/useSalonTier';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

// Type A: Solo Components
import { SoloDashboard } from './SoloDashboard';

// Type B: Team Components
import { SalonDashboard } from './SalonDashboard';

// Type C: Enterprise Components
import { NetworkDashboard } from './NetworkDashboard';

interface SalonRouterProps {
  // Optional: allow forcing a specific view
  forceView?: 'solo' | 'team' | 'enterprise';
}

export function SalonRouter({ forceView }: SalonRouterProps) {
  const { businessId } = useBusinessContext();
  const { tierInfo, loading } = useSalonTier(businessId || null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner
          variant="gradient"
          size="lg"
          message="Loading your salon dashboard..."
        />
      </div>
    );
  }

  if (!tierInfo) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load salon tier information. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Determine which view to show
  const view = forceView || tierInfo.tier;

  // Show upgrade suggestion if on Team and can upgrade
  const showUpgradeBanner =
    tierInfo.tier === 'team' &&
    !tierInfo.isManualOverride &&
    tierInfo.activeStylists >= 5;

  return (
    <div className="space-y-4">
      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <Alert className="border-purple-600 bg-purple-50">
          <Crown className="h-4 w-4 text-purple-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your team is growing! Consider upgrading to <strong>Enterprise</strong> for
              multi-location features.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => {
                // Navigate to settings
                window.location.href = '/settings/tier';
              }}
            >
              Learn More
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Render appropriate dashboard */}
      {view === 'solo' && <SoloDashboard />}
      {view === 'team' && <SalonDashboard />}
      {view === 'enterprise' && <NetworkDashboard />}
    </div>
  );
}

/**
 * Helper component for navigation menu
 * Shows which features are available based on tier
 */
export function SalonNavItems() {
  const { businessId } = useBusinessContext();
  const { tierInfo, loading } = useSalonTier(businessId || null);

  if (loading || !tierInfo) {
    return null;
  }

  const navItems: Array<{
    label: string;
    path: string;
    availableIn: Array<'solo' | 'team' | 'enterprise'>;
  }> = [
    { label: 'Dashboard', path: '/salon', availableIn: ['solo', 'team', 'enterprise'] },
    { label: 'Appointments', path: '/appointments', availableIn: ['solo', 'team', 'enterprise'] },
    { label: 'Clients', path: '/clients', availableIn: ['solo', 'team', 'enterprise'] },

    // Solo-specific
    { label: 'My Earnings', path: '/salon/earnings', availableIn: ['solo'] },

    // Team-specific
    { label: 'Team Status', path: '/salon/team', availableIn: ['team'] },
    { label: 'Commissions', path: '/salon/commissions', availableIn: ['team'] },

    // Enterprise-specific
    { label: 'Network Overview', path: '/salon/network', availableIn: ['enterprise'] },
    { label: 'Locations', path: '/salon/locations', availableIn: ['enterprise'] },
    { label: 'Leaderboard', path: '/salon/leaderboard', availableIn: ['enterprise'] },
    { label: 'Analytics', path: '/salon/analytics', availableIn: ['enterprise'] },
    { label: 'Inventory', path: '/salon/inventory', availableIn: ['enterprise'] },

    // Common
    { label: 'Services', path: '/services', availableIn: ['solo', 'team', 'enterprise'] },
    { label: 'Settings', path: '/settings', availableIn: ['solo', 'team', 'enterprise'] },
  ];

  return (
    <>
      {navItems
        .filter((item) => item.availableIn.includes(tierInfo.tier))
        .map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="block px-4 py-2 text-sm hover:bg-secondary rounded-md"
          >
            {item.label}
          </a>
        ))}
    </>
  );
}
