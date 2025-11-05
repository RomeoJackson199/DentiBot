import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { TemplateType, TemplateConfig, getTemplateConfig, TemplateFeatures, TemplateTerminology } from '@/lib/businessTemplates';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export interface CustomTemplateConfig {
  features?: TemplateFeatures;
  terminology?: TemplateTerminology;
  layoutCustomization?: any; // LayoutCustomization from businessTemplates
  appointmentReasons?: string[];
  serviceCategories?: string[];
  quickAddServices?: any[]; // QuickAddService[]
  completionSteps?: any[]; // CompletionStep[]
  navigationItems?: string[];
  aiBehaviorDefaults?: any; // AIBehaviorDefaults
  serviceFieldLabels?: any; // ServiceFieldLabels
}

interface TemplateContextType {
  template: TemplateConfig | null;
  templateType: TemplateType;
  loading: boolean;
  hasFeature: (feature: keyof TemplateFeatures) => boolean;
  t: (key: keyof TemplateTerminology) => string;
  updateTemplate: (newTemplateType: TemplateType, customConfig?: CustomTemplateConfig) => Promise<void>;
  refreshTemplate: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const { businessId, loading: businessLoading } = useBusinessContext();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [templateType, setTemplateType] = useState<TemplateType>('generic');
  const [loading, setLoading] = useState(true);
  const [customConfig, setCustomConfig] = useState<CustomTemplateConfig | undefined>();

  const loadTemplate = async () => {
    // Wait until business context finishes loading to avoid flicker
    if (businessLoading) {
      setLoading(true);
      return;
    }

    if (!businessId) {
      // No business selected - keep template null so features default to disabled
      setTemplate(null);
      setTemplateType('generic');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('template_type, custom_features, custom_terminology, custom_config')
        .eq('id', businessId)
        .single();

      if (error) {
        logger.error('Error loading template', { error, businessId });
        throw error;
      }

      const type = (data?.template_type || 'generic') as TemplateType;
      setTemplateType(type);

      // If custom template, merge custom configuration
      if (type === 'custom') {
        const baseConfig = getTemplateConfig('custom');

        // Check if there's a full custom_config (new format)
        const fullConfig = data?.custom_config as CustomTemplateConfig | null;

        // Fallback to old format if custom_config doesn't exist
        const config: CustomTemplateConfig = fullConfig || {
          features: data?.custom_features as TemplateFeatures,
          terminology: data?.custom_terminology as TemplateTerminology,
        };

        const mergedConfig: TemplateConfig = {
          ...baseConfig,
          features: { ...baseConfig.features, ...(config.features || {}) },
          terminology: { ...baseConfig.terminology, ...(config.terminology || {}) },
          layoutCustomization: { ...baseConfig.layoutCustomization, ...(config.layoutCustomization || {}) },
          appointmentReasons: config.appointmentReasons || baseConfig.appointmentReasons,
          serviceCategories: config.serviceCategories || baseConfig.serviceCategories,
          quickAddServices: config.quickAddServices || baseConfig.quickAddServices,
          completionSteps: config.completionSteps || baseConfig.completionSteps,
          navigationItems: config.navigationItems || baseConfig.navigationItems,
          aiBehaviorDefaults: { ...baseConfig.aiBehaviorDefaults, ...(config.aiBehaviorDefaults || {}) },
          serviceFieldLabels: { ...baseConfig.serviceFieldLabels, ...(config.serviceFieldLabels || {}) },
        };

        setTemplate(mergedConfig);
        setCustomConfig(config);
      } else {
        setTemplate(getTemplateConfig(type));
        setCustomConfig(undefined);
      }
    } catch (error) {
      logger.error('Failed to load template', { error, businessId });
      // Fail closed: hide gated features instead of defaulting to generic
      setTemplate(null);
      setTemplateType('generic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [businessId, businessLoading]);

  const hasFeature = (feature: keyof TemplateFeatures): boolean => {
    return template?.features[feature] ?? false;
  };

  const t = (key: keyof TemplateTerminology): string => {
    return template?.terminology[key] ?? key;
  };

  const updateTemplate = async (
    newTemplateType: TemplateType,
    newCustomConfig?: CustomTemplateConfig
  ) => {
    if (!businessId) {
      throw new Error('No business ID available');
    }

    // Record template change in history (best-effort)
    const { data: currentBusiness } = await supabase
      .from('businesses')
      .select('template_type')
      .eq('id', businessId)
      .maybeSingle();

    if (currentBusiness && currentBusiness.template_type !== newTemplateType) {
      try {
        // Optional audit trail; ignore if table doesn't exist or RLS blocks it
        await supabase.from('template_change_history').insert({
          business_id: businessId,
          from_template: currentBusiness.template_type,
          to_template: newTemplateType,
          changed_at: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn('Template audit skipped', { reason: 'missing_table_or_rls', error: e });
      }
    }

    // Persist the new template to the database so future sessions load correctly
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        template_type: newTemplateType,
        custom_features: newTemplateType === 'custom' ? (newCustomConfig?.features ?? null) : null,
        custom_terminology: newTemplateType === 'custom' ? (newCustomConfig?.terminology ?? null) : null,
        custom_config: newTemplateType === 'custom' ? (newCustomConfig ?? null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      logger.error('Failed to persist template update', { updateError, businessId, newTemplateType });
      throw updateError;
    }

    // Update template in state immediately for instant UI update
    setTemplateType(newTemplateType);

    if (newTemplateType === 'custom' && newCustomConfig) {
      const baseConfig = getTemplateConfig('custom');
      const mergedConfig: TemplateConfig = {
        ...baseConfig,
        features: { ...baseConfig.features, ...(newCustomConfig.features || {}) },
        terminology: { ...baseConfig.terminology, ...(newCustomConfig.terminology || {}) },
        layoutCustomization: { ...baseConfig.layoutCustomization, ...(newCustomConfig.layoutCustomization || {}) },
        appointmentReasons: newCustomConfig.appointmentReasons || baseConfig.appointmentReasons,
        serviceCategories: newCustomConfig.serviceCategories || baseConfig.serviceCategories,
        quickAddServices: newCustomConfig.quickAddServices || baseConfig.quickAddServices,
        completionSteps: newCustomConfig.completionSteps || baseConfig.completionSteps,
        navigationItems: newCustomConfig.navigationItems || baseConfig.navigationItems,
        aiBehaviorDefaults: { ...baseConfig.aiBehaviorDefaults, ...(newCustomConfig.aiBehaviorDefaults || {}) },
        serviceFieldLabels: { ...baseConfig.serviceFieldLabels, ...(newCustomConfig.serviceFieldLabels || {}) },
      };
      setTemplate(mergedConfig);
      setCustomConfig(newCustomConfig);
    } else {
      setTemplate(getTemplateConfig(newTemplateType));
      setCustomConfig(undefined);
    }

    // Invalidate all queries to refetch with new template context
    await queryClient.invalidateQueries();

    logger.info('Template updated successfully', {
      businessId,
      newTemplateType,
      hasCustomConfig: !!newCustomConfig,
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
