import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { TemplateType, TemplateConfig, getTemplateConfig, TemplateFeatures, TemplateTerminology } from '@/lib/businessTemplates';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface TemplateContextType {
  template: TemplateConfig | null;
  templateType: TemplateType;
  loading: boolean;
  hasFeature: (feature: keyof TemplateFeatures) => boolean;
  t: (key: keyof TemplateTerminology) => string;
  updateTemplate: (newTemplateType: TemplateType, customFeatures?: TemplateFeatures, customTerminology?: TemplateTerminology) => Promise<void>;
  refreshTemplate: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const { businessId } = useBusinessContext();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [templateType, setTemplateType] = useState<TemplateType>('generic');
  const [loading, setLoading] = useState(true);
  const [customFeatures, setCustomFeatures] = useState<TemplateFeatures | undefined>();
  const [customTerminology, setCustomTerminology] = useState<TemplateTerminology | undefined>();

  const loadTemplate = async () => {
    if (!businessId) {
      const defaultConfig = getTemplateConfig('generic');
      setTemplate(defaultConfig);
      setTemplateType('generic');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('template_type, custom_features, custom_terminology')
        .eq('id', businessId)
        .single();

      if (error) {
        logger.error('Error loading template', { error, businessId });
        throw error;
      }

      const type = (data?.template_type || 'generic') as TemplateType;
      setTemplateType(type);

      // If custom template, merge custom configuration
      if (type === 'custom' && (data?.custom_features || data?.custom_terminology)) {
        const baseConfig = getTemplateConfig('custom');
        const mergedConfig: TemplateConfig = {
          ...baseConfig,
          features: { ...baseConfig.features, ...(data.custom_features as TemplateFeatures) },
          terminology: { ...baseConfig.terminology, ...(data.custom_terminology as TemplateTerminology) },
        };
        setTemplate(mergedConfig);
        setCustomFeatures(data.custom_features as TemplateFeatures);
        setCustomTerminology(data.custom_terminology as TemplateTerminology);
      } else {
        setTemplate(getTemplateConfig(type));
      }
    } catch (error) {
      logger.error('Failed to load template', { error, businessId });
      setTemplate(getTemplateConfig('generic'));
      setTemplateType('generic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [businessId]);

  const hasFeature = (feature: keyof TemplateFeatures): boolean => {
    return template?.features[feature] ?? false;
  };

  const t = (key: keyof TemplateTerminology): string => {
    return template?.terminology[key] ?? key;
  };

  const updateTemplate = async (
    newTemplateType: TemplateType,
    newCustomFeatures?: TemplateFeatures,
    newCustomTerminology?: TemplateTerminology
  ) => {
    if (!businessId) {
      throw new Error('No business ID available');
    }

    // Record template change in history
    const { data: currentBusiness } = await supabase
      .from('businesses')
      .select('template_type')
      .eq('id', businessId)
      .single();

    if (currentBusiness && currentBusiness.template_type !== newTemplateType) {
      // Insert audit record
      await supabase.from('template_change_history').insert({
        business_id: businessId,
        from_template: currentBusiness.template_type,
        to_template: newTemplateType,
        changed_at: new Date().toISOString(),
      });
    }

    // Update template in state immediately for instant UI update
    setTemplateType(newTemplateType);

    if (newTemplateType === 'custom' && (newCustomFeatures || newCustomTerminology)) {
      const baseConfig = getTemplateConfig('custom');
      const mergedConfig: TemplateConfig = {
        ...baseConfig,
        features: { ...baseConfig.features, ...newCustomFeatures },
        terminology: { ...baseConfig.terminology, ...newCustomTerminology },
      };
      setTemplate(mergedConfig);
      setCustomFeatures(newCustomFeatures);
      setCustomTerminology(newCustomTerminology);
    } else {
      setTemplate(getTemplateConfig(newTemplateType));
    }

    // Invalidate all queries to refetch with new template context
    await queryClient.invalidateQueries();

    logger.info('Template updated successfully', {
      businessId,
      newTemplateType,
      hasCustomConfig: !!(newCustomFeatures || newCustomTerminology),
    });
  };

  const refreshTemplate = async () => {
    await loadTemplate();
  };

  return (
    <TemplateContext.Provider
      value={{
        template,
        templateType,
        loading,
        hasFeature,
        t,
        updateTemplate,
        refreshTemplate,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}
