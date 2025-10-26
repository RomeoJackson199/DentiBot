import { useEffect, useState } from 'react';
import { useBusinessContext } from './useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  TemplateType, 
  TemplateConfig, 
  getTemplateConfig 
} from '@/lib/businessTemplates';

export function useBusinessTemplate() {
  const { businessId } = useBusinessContext();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setTemplate(getTemplateConfig('generic'));
      setLoading(false);
      return;
    }

    const loadTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('template_type')
          .eq('id', businessId)
          .single();

        if (error) throw error;

        const templateType = (data?.template_type || 'dentist') as TemplateType;
        setTemplate(getTemplateConfig(templateType));
      } catch (error) {
        console.error('Error loading template:', error);
        setTemplate(getTemplateConfig('dentist'));
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [businessId]);

  const hasFeature = (feature: keyof TemplateConfig['features']): boolean => {
    return template?.features[feature] ?? false;
  };

  const t = (key: keyof TemplateConfig['terminology']): string => {
    return template?.terminology[key] ?? key;
  };

  return {
    template,
    loading,
    hasFeature,
    t,
  };
}
