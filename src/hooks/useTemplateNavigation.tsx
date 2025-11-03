import { useMemo } from 'react';
import { useBusinessTemplate } from './useBusinessTemplate';
import { useRestaurantRole } from './useRestaurantRole';
import { UtensilsCrossed, ChefHat, Users as UsersIcon, Table } from 'lucide-react';

export function useTemplateNavigation() {
  const { template, hasFeature } = useBusinessTemplate();
  const { role: restaurantRole, loading: roleLoading } = useRestaurantRole();
  const templateType = template?.id || 'dentist';

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

  // Get restaurant-specific navigation items based on role
  const getRestaurantNavItems = useMemo(() => {
    if (templateType !== 'restaurant' || roleLoading) return [];

    const items = [];

    // Owner/Manager gets all access
    if (restaurantRole === 'owner' || restaurantRole === 'manager') {
      items.push(
        {
          id: 'restaurant-owner',
          label: 'Restaurant Management',
          icon: UtensilsCrossed,
          path: '/restaurant/owner',
        }
      );
    }

    // Waiter dashboard
    if (restaurantRole === 'waiter') {
      items.push(
        {
          id: 'restaurant-waiter',
          label: 'My Tables',
          icon: Table,
          path: '/restaurant/waiter',
        }
      );
    }

    // Kitchen dashboard
    if (restaurantRole === 'cook') {
      items.push(
        {
          id: 'restaurant-kitchen',
          label: 'Kitchen',
          icon: ChefHat,
          path: '/restaurant/kitchen',
        }
      );
    }

    return items;
  }, [templateType, restaurantRole, roleLoading]);

  return {
    filterNavItems,
    getRestaurantNavItems,
    isRestaurant: templateType === 'restaurant',
    restaurantRole,
    isNavItemVisible: (navItemId: string) => true, // Backward compatibility
    shouldShowFeatureNav: (navItemId: string) => true, // Backward compatibility
  };
}
