/**
 * @deprecated Use useTemplate from @/contexts/TemplateContext instead.
 * This hook is kept for backward compatibility and wraps the new context-based approach.
 */
import { useTemplate } from '@/contexts/TemplateContext';
import { TemplateConfig } from '@/lib/businessTemplates';
import { useBusinessContext } from '@/hooks/useBusinessContext';

export function useBusinessTemplate() {
  const { template, loading, hasFeature, t } = useTemplate();
  const { loading: businessLoading } = useBusinessContext();
  const combinedLoading = loading || businessLoading;

  return {
    template,
    loading: combinedLoading,
    hasFeature,
    t,
  };
}
