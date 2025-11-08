/**
 * Salon Components - Type A (Solo), Type B (Team), Type C (Enterprise)
 * Optimized for salons of all sizes
 *
 * IMPORTANT: Use SalonRouter for automatic tier detection!
 * It will show the right dashboard based on your team size.
 */

// Note: Salon components have been removed as only healthcare template is supported

// ===== TYPE A: SOLO STYLIST (1 person) =====
export { SoloDashboard } from './SoloDashboard';
export { QuickBooking } from './QuickBooking';
export { BreakManager } from './BreakManager';
export { PersonalEarnings } from './PersonalEarnings';

// ===== TYPE B: TEAM SALON (2-10 stylists) =====
export { SalonDashboard } from './SalonDashboard';
export { TeamStatusBoard } from './TeamStatusBoard';
export { QuickCheckout } from './QuickCheckout';
export { WalkInManager } from './WalkInManager';
export { CommissionCalculator } from './CommissionCalculator';

// ===== TYPE C: ENTERPRISE (unlimited) =====
export { NetworkDashboard } from './NetworkDashboard';
export { NetworkLeaderboard } from './NetworkLeaderboard';
export { LocationAnalytics } from './LocationAnalytics';
export { CentralInventory } from './CentralInventory';
