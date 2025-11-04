/**
 * Tier Upgrade Settings - Salon Tier Management
 *
 * Allows businesses to upgrade from Team (B) to Enterprise (C)
 * Shows current tier, recommended tier, and upgrade options
 */

import { useState } from 'react';
import { useSalonTier } from '@/hooks/useSalonTier';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Users,
  Building2,
  Crown,
  TrendingUp,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { formatTierPrice } from '@/lib/salonTiers';

export function TierUpgradeSettings() {
  const { businessId } = useBusinessContext();
  const { tierInfo, loading, upgradeToEnterprise, resetToAuto } = useSalonTier(businessId || null);
  const { toast } = useToast();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgradeToEnterprise = async () => {
    setUpgrading(true);
    try {
      await upgradeToEnterprise();
      toast({
        title: 'Upgraded to Enterprise!',
        description: 'You now have access to multi-location features.',
      });
      setShowUpgradeDialog(false);
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to upgrade to Enterprise tier. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleResetToAuto = async () => {
    try {
      await resetToAuto();
      toast({
        title: 'Tier Reset',
        description: 'Your tier will now be automatically determined by your team size.',
      });
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset tier. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <ModernLoadingSpinner variant="overlay" size="md" message="Loading tier info..." />
      </div>
    );
  }

  if (!tierInfo) {
    return null;
  }

  const getTierIcon = (tier: string) => {
    if (tier === 'solo') return <User className="h-5 w-5" />;
    if (tier === 'team') return <Users className="h-5 w-5" />;
    return <Building2 className="h-5 w-5" />;
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'solo') return <Badge variant="outline">Type A - Solo</Badge>;
    if (tier === 'team') return <Badge variant="default">Type B - Team</Badge>;
    return <Badge className="bg-purple-600">Type C - Enterprise</Badge>;
  };

  const getTierDescription = (tier: string) => {
    if (tier === 'solo') return 'Perfect for independent stylists';
    if (tier === 'team') return 'Great for small teams (2-10 stylists)';
    return 'Full multi-location management';
  };

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {getTierIcon(tierInfo.tier)}
                <span className="ml-2">Current Plan</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {getTierDescription(tierInfo.tier)}
              </CardDescription>
            </div>
            {getTierBadge(tierInfo.tier)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Active Stylists</div>
              <div className="text-2xl font-bold">{tierInfo.activeStylists}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Locations</div>
              <div className="text-2xl font-bold">{tierInfo.activeLocations || 1}</div>
            </div>
          </div>

          {tierInfo.isManualOverride && (
            <Alert className="mt-4">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                You're on a manually selected plan.{' '}
                <Button variant="link" className="p-0 h-auto" onClick={handleResetToAuto}>
                  Switch to automatic
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!tierInfo.isManualOverride && tierInfo.tier !== tierInfo.recommendedTier && (
            <Alert className="mt-4">
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Based on your team size, we recommend: {getTierBadge(tierInfo.recommendedTier)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {tierInfo.tier !== 'enterprise' && tierInfo.canUpgradeToEnterprise && (
        <Card className="border-2 border-purple-600/50 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
              Upgrade to Enterprise
            </CardTitle>
            <CardDescription>
              Unlock multi-location features for your growing business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Tier Card */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Current: {tierInfo.tier === 'solo' ? 'Solo' : 'Team'}</div>
                    <div className="text-lg font-bold">{formatTierPrice(tierInfo.tier as any)}</div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tierInfo.tier === 'solo' ? (
                      <>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />1 stylist only
                        </li>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />Personal earnings
                        </li>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />Break management
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />Up to 10 stylists
                        </li>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />Team coordination
                        </li>
                        <li className="flex items-center">
                          <Check className="mr-2 h-4 w-4" />Commission tracking
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Enterprise Card */}
                <div className="border-2 border-purple-600 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium flex items-center">
                      <Crown className="mr-1 h-4 w-4 text-purple-600" />
                      Enterprise
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {formatTierPrice('enterprise')}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center font-medium text-purple-600">
                      <Check className="mr-2 h-4 w-4" />
                      Unlimited locations
                    </li>
                    <li className="flex items-center font-medium text-purple-600">
                      <Check className="mr-2 h-4 w-4" />
                      Network dashboard
                    </li>
                    <li className="flex items-center font-medium text-purple-600">
                      <Check className="mr-2 h-4 w-4" />
                      Central inventory
                    </li>
                    <li className="flex items-center font-medium text-purple-600">
                      <Check className="mr-2 h-4 w-4" />
                      Network leaderboard
                    </li>
                    <li className="flex items-center font-medium text-purple-600">
                      <Check className="mr-2 h-4 w-4" />
                      Location analytics
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade to Enterprise
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tierInfo.tier === 'enterprise' && (
        <Card className="border-purple-600">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-600">
              <Crown className="mr-2 h-5 w-5" />
              You're on Enterprise
            </CardTitle>
            <CardDescription>
              You have access to all multi-location features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Network Dashboard
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Network Leaderboard
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Location Analytics
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Central Inventory Management
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Unlimited Locations & Stylists
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="mr-2 h-5 w-5 text-purple-600" />
              Upgrade to Enterprise
            </DialogTitle>
            <DialogDescription>
              Unlock multi-location features to manage your salon chain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-purple-600">
                  {formatTierPrice('enterprise')}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">What you'll get:</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Manage unlimited salon locations
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Network-wide analytics and reporting
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Cross-location leaderboard
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Central inventory distribution
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Location-specific pricing
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleUpgradeToEnterprise}
              disabled={upgrading}
            >
              {upgrading ? 'Upgrading...' : 'Confirm Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
