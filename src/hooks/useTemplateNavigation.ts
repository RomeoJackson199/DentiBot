import { useTemplate } from '@/contexts/TemplateContext';
import { useMemo } from 'react';

/**
 * Hook to check if a navigation item should be visible based on the current template
 */
export function useTemplateNavigation() {
  const { template, hasFeature } = useTemplate();

  const isNavItemVisible = useMemo(() => {
    return (navItemId: string): boolean => {
      if (!template) return true; // Show all by default if template not loaded

      // Check if this navigation item is in the template's allowed navigation items
      const allowedItems = template.navigationItems || [];

      // If navigationItems is empty, allow all (backward compatibility)
      if (allowedItems.length === 0) return true;

      return allowedItems.includes(navItemId);
    };
  }, [template]);

  /**
   * Filter a list of navigation items based on template configuration
   */
  const filterNavItems = useMemo(() => {
    return <T extends { id: string }>(items: T[]): T[] => {
      if (!template) return items;

      const allowedItems = template.navigationItems || [];

      // If navigationItems is empty, allow all (backward compatibility)
      if (allowedItems.length === 0) return items;

      return items.filter(item => allowedItems.includes(item.id));
    };
  }, [template]);

  /**
   * Check if a specific feature-dependent nav item should be shown
   * This provides additional feature-level filtering beyond basic navigation
   */
  const shouldShowFeatureNav = useMemo(() => {
    return (navItemId: string): boolean => {
      // Map navigation items to required features
      const featureMap: Record<string, keyof typeof template.features | null> = {
        'prescriptions': 'prescriptions',
        'treatment-plans': 'treatmentPlans',
        'medical-records': 'medicalRecords',
        'photos': 'photoUpload',
        'urgency': 'urgencyLevels',
        'payments': 'paymentRequests',
        'ai-chat': 'aiChat',
        'appointments': 'appointments',
        'services': 'services',
        // Items without feature requirements
        'dashboard': null,
        'patients': null,
        'employees': null,
        'messages': null,
        'analytics': null,
        'settings': null,
        'branding': null,
        'schedule': null,
        'reports': null,
        'inventory': null,
        'imports': null,
        'security': null,
        'users': null,
        'team': null,
      };

      const requiredFeature = featureMap[navItemId];

      // If no feature requirement, just check if it's in navigationItems
      if (requiredFeature === null) {
        return isNavItemVisible(navItemId);
      }

      // Check both navigation permission AND feature flag
      return isNavItemVisible(navItemId) && hasFeature(requiredFeature);
    };
  }, [template, hasFeature, isNavItemVisible]);

  return {
    isNavItemVisible,
    filterNavItems,
    shouldShowFeatureNav,
  };
}
