# 🔄 Automatic Salon Tier Switching

## Overview

Your salon tier is **automatically determined** by your team size:

| Team Size | Automatic Tier | Features |
|-----------|---------------|----------|
| **1 stylist** | Type A (Solo) | Personal earnings, break manager, quick rebooking |
| **2-10 stylists** | Type B (Team) | Team status, commissions, walk-in manager |
| **Manual upgrade** | Type C (Enterprise) | Multi-location, network analytics, central inventory |

---

## 🤖 How It Works

### Automatic Detection

The system **automatically switches** your tier when you:
- ✅ Add a second stylist → Upgrades from Solo to Team
- ✅ Remove stylists → Downgrades from Team to Solo (if only 1 left)
- ✅ Add a second location → Suggests Enterprise upgrade

**No manual configuration needed!** Just add/remove team members and the right dashboard appears.

---

## 📊 What You See

### Starting as Solo (1 Stylist)

```typescript
// Your dashboard shows:
import { SalonRouter } from '@/components/salon';

<SalonRouter /> // Automatically shows SoloDashboard
```

**Features you get:**
- Today's schedule overview
- Personal earnings tracking (weekly/monthly)
- One-tap break management
- Quick rebooking for returning clients
- Recurring appointments
- Client notes and color formulas

### Growing to Team (2+ Stylists)

When you add a second stylist, **the dashboard automatically changes** to Team mode!

```typescript
<SalonRouter /> // Now automatically shows SalonDashboard (Team)
```

**New features unlocked:**
- Team status board (who's busy/free)
- Commission calculator by stylist level
- Quick checkout with tips
- Walk-in manager with stylist selection
- Team coordination tools

### Upgrading to Enterprise (Manual)

When you're ready for multi-location, go to **Settings → Tier Management**:

```typescript
import { TierUpgradeSettings } from '@/components/salon';

<TierUpgradeSettings />
```

Click "Upgrade to Enterprise" → Dashboard changes to Network view!

**Enterprise features:**
- Network dashboard (all locations)
- Cross-location leaderboard
- Location performance analytics
- Central inventory & distribution
- Unlimited locations & stylists

---

## 🎯 Usage Examples

### Example 1: Simple Integration

Just use `SalonRouter` and forget about it:

```typescript
import { SalonRouter } from '@/components/salon';

export function DashboardPage() {
  return (
    <div>
      <SalonRouter />
      {/* That's it! Shows the right dashboard automatically */}
    </div>
  );
}
```

### Example 2: Check Current Tier

```typescript
import { useSalonTier } from '@/hooks/useSalonTier';

function MyComponent() {
  const { tierInfo, loading } = useSalonTier(businessId);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Current tier: {tierInfo.tier}</p>
      <p>Active stylists: {tierInfo.activeStylists}</p>
      <p>Can upgrade: {tierInfo.canUpgradeToEnterprise ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Example 3: Conditional Features

```typescript
import { useSalonTier } from '@/hooks/useSalonTier';

function SettingsPage() {
  const { tierInfo } = useSalonTier(businessId);

  return (
    <div>
      {/* Solo-only features */}
      {tierInfo.tier === 'solo' && (
        <PersonalEarnings />
      )}

      {/* Team and Enterprise features */}
      {(tierInfo.tier === 'team' || tierInfo.tier === 'enterprise') && (
        <CommissionCalculator />
      )}

      {/* Enterprise-only features */}
      {tierInfo.tier === 'enterprise' && (
        <NetworkLeaderboard />
      )}
    </div>
  );
}
```

### Example 4: Tier Upgrade Settings

```typescript
import { TierUpgradeSettings } from '@/components/salon';

function SettingsPage() {
  return (
    <div>
      <h1>Salon Settings</h1>
      <TierUpgradeSettings />
      {/* Shows upgrade options and current tier info */}
    </div>
  );
}
```

---

## 🔄 The Upgrade Flow

### Scenario: You Start Solo

```
Day 1: You (solo stylist)
└─> Tier: Solo (Type A)
└─> Dashboard: SoloDashboard
└─> Features: Personal earnings, breaks, quick rebooking
```

### Scenario: You Hire Your First Stylist

```
Day 30: You hire Emma
└─> Trigger: 2nd stylist added
└─> Tier: Team (Type B) ⬆️ AUTOMATIC UPGRADE
└─> Dashboard: SalonDashboard
└─> Features: Team status, commissions, walk-in manager
```

**What happens:**
1. You click "Add Stylist" and create Emma's profile
2. Database trigger fires: `auto_update_salon_tier()`
3. Tier changes from 'solo' → 'team'
4. Next time you refresh, you see the Team dashboard
5. No configuration needed!

### Scenario: You Want Multiple Locations

```
Day 180: You open 2nd location
└─> Action: Go to Settings → Tier Management
└─> Click: "Upgrade to Enterprise"
└─> Tier: Enterprise (Type C) ⬆️ MANUAL UPGRADE
└─> Dashboard: NetworkDashboard
└─> Features: Multi-location, network analytics, inventory
```

**What happens:**
1. You see the upgrade banner: "Upgrade to Enterprise"
2. You click "Learn More" → Goes to TierUpgradeSettings
3. You click "Upgrade to Enterprise"
4. Database function: `upgrade_to_enterprise()`
5. Sets `manual_tier_override = true`
6. Dashboard changes to NetworkDashboard
7. You can now add locations!

---

## 💰 Pricing

| Tier | Price | When It Applies |
|------|-------|----------------|
| **Solo** | FREE | Automatically when 1 stylist |
| **Team** | €49/month | Automatically when 2+ stylists |
| **Enterprise** | €199/month | Manual upgrade only |

**Important:**
- Solo → Team upgrade is FREE for first 30 days (trial)
- Team → Enterprise requires manual confirmation
- You can downgrade anytime (goes back to automatic tier)

---

## 🛠️ Database Functions

### Auto-Calculate Tier

```sql
SELECT calculate_salon_tier('business-id');
-- Returns: 'solo', 'team', or 'enterprise'
```

### Manual Upgrade to Enterprise

```sql
SELECT upgrade_to_enterprise('business-id');
-- Sets tier to 'enterprise' with manual_tier_override = true
```

### Reset to Automatic

```sql
SELECT reset_to_auto_tier('business-id');
-- Resets to automatic tier detection
-- Returns the new auto-calculated tier
```

### Check Business Tier Info

```sql
SELECT * FROM business_tier_info
WHERE business_id = 'your-business-id';

-- Returns:
-- business_id, business_name, salon_tier,
-- manual_tier_override, active_stylists, active_locations,
-- recommended_tier
```

---

## 🎭 Real-World Scenarios

### Scenario 1: "I want to try Team features"

**Option A: Add a test stylist**
1. Add a dummy stylist account
2. Tier auto-upgrades to Team
3. Explore team features
4. Remove dummy stylist if not needed
5. Tier auto-downgrades to Solo

**Option B: Force Team tier** (not recommended)
```sql
-- Manual override (use with caution)
UPDATE businesses
SET salon_tier = 'team', manual_tier_override = true
WHERE id = 'your-business-id';
```

### Scenario 2: "I hired 3 stylists but still see Solo"

**Check:**
1. Are all stylists marked as `is_active = true`?
2. Are they linked to the correct `business_id`?
3. Run manual tier calculation:
   ```sql
   SELECT calculate_salon_tier('your-business-id');
   ```

**Fix:**
```sql
-- Force tier recalculation
SELECT reset_to_auto_tier('your-business-id');
```

### Scenario 3: "I want Enterprise but only have 1 location"

**You can still upgrade!**
1. Go to Settings → Tier Management
2. Click "Upgrade to Enterprise"
3. You'll have Enterprise features ready when you add your 2nd location

### Scenario 4: "I upgraded to Enterprise but want to downgrade"

```typescript
// Use TierUpgradeSettings component
import { useSalonTier } from '@/hooks/useSalonTier';

const { resetToAuto } = useSalonTier(businessId);
await resetToAuto();
// Tier goes back to 'team' (based on stylist count)
```

Or SQL:
```sql
SELECT reset_to_auto_tier('your-business-id');
```

---

## 🚨 Troubleshooting

### Dashboard not updating after adding stylists?

**Refresh the page.** The tier is calculated server-side and cached.

### Still showing wrong tier?

Run this SQL to check:
```sql
SELECT
  id,
  name,
  salon_tier as current_tier,
  manual_tier_override,
  calculate_salon_tier(id) as should_be_tier
FROM businesses
WHERE id = 'your-business-id';
```

### Want to manually set a specific tier?

```sql
-- Set to Team (manual)
UPDATE businesses
SET salon_tier = 'team', manual_tier_override = true
WHERE id = 'your-business-id';

-- Set to Enterprise (manual)
SELECT upgrade_to_enterprise('your-business-id');

-- Reset to automatic
SELECT reset_to_auto_tier('your-business-id');
```

---

## 📚 Component Reference

### `<SalonRouter />`

Automatically renders the correct dashboard.

```typescript
<SalonRouter />
// or force a specific view:
<SalonRouter forceView="enterprise" />
```

### `<TierUpgradeSettings />`

Shows current tier, upgrade options, and pricing.

```typescript
<TierUpgradeSettings />
```

### `useSalonTier(businessId)`

Hook for tier information and actions.

```typescript
const {
  tierInfo,           // Current tier info
  loading,            // Loading state
  refreshTier,        // Manually refresh
  upgradeToEnterprise,  // Upgrade function
  resetToAuto,        // Reset to automatic
} = useSalonTier(businessId);
```

---

## ✅ Summary

1. **Automatic by default**: Tier adjusts when you add/remove stylists
2. **No configuration**: Just use `<SalonRouter />` and it works
3. **Manual upgrade**: Go to Settings for Enterprise
4. **Can reset**: Downgrade back to automatic anytime
5. **Real-time**: Changes apply immediately (after page refresh)

**That's it!** The system handles tier management for you automatically. 🎉
