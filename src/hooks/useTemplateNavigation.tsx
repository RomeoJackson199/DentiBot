import { useMemo } from 'react';
import { useBusinessTemplate } from './useBusinessTemplate';
import { UtensilsCrossed, ChefHat, Users as UsersIcon, Table } from 'lucide-react';

export function useTemplateNavigation() {
  const { template, hasFeature } = useBusinessTemplate();
  const templateType = template?.id || 'healthcare';

  // Filter navigation items based on template features
  const filterNavItems = <T extends { id: string }>(items: T[]): T[] => {
    return items.filter(item => {
      // Always show dashboard
      if (item.id === 'dashboard') return true;

      // Feature-based filtering
      if (item.id === 'prescriptions' && !hasFeature('prescriptions')) return false;
      if (item.id === 'treatment' && !hasFeature('treatmentPlans')) return false;
      if (item.id === 'records' && !hasFeature('medicalRecords')) return false;

      return true;
    });
  };

  return {
    filterNavItems,
    getRestaurantNavItems: [],
    isRestaurant: false,
    restaurantRole: null,
    isNavItemVisible: (navItemId: string) => true, // Backward compatibility
    shouldShowFeatureNav: (navItemId: string) => true, // Backward compatibility
  };
}
