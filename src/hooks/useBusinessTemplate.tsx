/**
 * @deprecated Use useTemplate from @/contexts/TemplateContext instead.
 * This hook is kept for backward compatibility and wraps the new context-based approach.
 */
import { useTemplate } from '@/contexts/TemplateContext';
import { TemplateConfig } from '@/lib/businessTemplates';

export function useBusinessTemplate() {
  const { template, loading, hasFeature, t } = useTemplate();

  return {
    template,
    loading,
    hasFeature,
    t,
  };
}
