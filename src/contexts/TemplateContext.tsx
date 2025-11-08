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
  const [templateType, setTemplateType] = useState<TemplateType>('healthcare');
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
      setTemplateType('healthcare');
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

      const type = (data?.template_type || 'healthcare') as TemplateType;
      setTemplateType(type);

      setTemplate(getTemplateConfig(type));
      setCustomConfig(undefined);
    } catch (error) {
      logger.error('Failed to load template', { error, businessId });
      // Fail closed: hide gated features instead of defaulting to healthcare
      setTemplate(null);
      setTemplateType('healthcare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [businessId, businessLoading]);

  // Subscribe to real-time template changes
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`business-template-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${businessId}`,
        },
        (payload) => {
          logger.info('Template changed in database, reloading...', { businessId });
          loadTemplate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

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
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      logger.error('Failed to persist template update', { updateError, businessId, newTemplateType });
      throw updateError;
    }

    // Update template in state immediately for instant UI update
    setTemplateType(newTemplateType);
    setTemplate(getTemplateConfig(newTemplateType));
    setCustomConfig(undefined);

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
