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
      console.log('🔧 useBusinessTemplate: No businessId, using generic template');
      setTemplate(getTemplateConfig('generic'));
      setLoading(false);
      return;
    }

    const loadTemplate = async () => {
      try {
        console.log('🔧 useBusinessTemplate: Loading template for businessId:', businessId);
        const { data, error } = await supabase
          .from('businesses')
          .select('template_type')
          .eq('id', businessId)
          .single();

        if (error) throw error;

        const templateType = (data?.template_type || 'dentist') as TemplateType;
        console.log('🔧 useBusinessTemplate: Loaded template type:', templateType);
        console.log('🔧 useBusinessTemplate: Template features:', getTemplateConfig(templateType).features);
        setTemplate(getTemplateConfig(templateType));
      } catch (error) {
        console.error('❌ Error loading template:', error);
        // Fallback to generic template to avoid exposing medical features
        setTemplate(getTemplateConfig('generic'));
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [businessId]);

  const hasFeature = (feature: keyof TemplateConfig['features']): boolean => {
    const result = template?.features[feature] ?? false;
    console.log(`🔧 hasFeature("${feature}"):`, result, 'template:', template?.id);
    return result;
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
