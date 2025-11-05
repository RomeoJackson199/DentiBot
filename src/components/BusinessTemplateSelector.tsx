import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Info, Settings } from 'lucide-react';
import { getAllTemplates, TemplateConfig } from '@/lib/businessTemplates';
import { cn } from '@/lib/utils';
import { TemplateFeatureExplainer } from './TemplateFeatureExplainer';
import { CustomTemplateConfigurator, FullTemplateConfig } from './CustomTemplateConfigurator';

interface BusinessTemplateSelectorProps {
  selectedTemplate?: string;
  onSelect: (templateId: string, customConfig?: FullTemplateConfig) => void;
  disabled?: boolean;
  customConfig?: FullTemplateConfig;
}

export function BusinessTemplateSelector({ 
  selectedTemplate, 
  onSelect,
  disabled = false,
  customConfig 
}: BusinessTemplateSelectorProps) {
  const templates = getAllTemplates().filter(t => t.id === 'healthcare');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [customizingCustom, setCustomizingCustom] = useState(false);

  const renderFeaturesList = (template: TemplateConfig) => {
    const enabledFeatures = Object.entries(template.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);

    return (
      <div className="space-y-1">
        {enabledFeatures.slice(0, 4).map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-primary" />
            <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>
        ))}
        {enabledFeatures.length > 4 && (
          <div className="text-xs text-muted-foreground">
            + {enabledFeatures.length - 4} more features
          </div>
        )}
      </div>
    );
  };

  const previewingTemplate = previewTemplate ? templates.find(t => t.id === previewTemplate) : null;

  const handleTemplateClick = (templateId: string) => {
    if (disabled) return;
    
    if (templateId === 'custom') {
      setCustomizingCustom(true);
    } else {
      onSelect(templateId);
    }
  };

  const handleCustomSave = (config: FullTemplateConfig) => {
    onSelect('custom', config);
    setCustomizingCustom(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Choose Your Business Template</h3>
          <p className="text-sm text-muted-foreground">
            Select the template that best fits your business type. This will customize the features and terminology used throughout the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            const isHovered = hoveredTemplate === template.id;

            return (
              <Card
                key={template.id}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  isSelected && 'ring-2 ring-primary shadow-lg',
                  isHovered && !isSelected && 'shadow-md scale-[1.02]',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => handleTemplateClick(template.id)}
                onMouseEnter={() => !disabled && setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Terminology:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.terminology.customerPlural}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.terminology.providerPlural}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.terminology.servicePlural}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Key Features:
                      </div>
                      {renderFeaturesList(template)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (template.id === 'custom') {
                          setCustomizingCustom(true);
                        } else {
                          setPreviewTemplate(template.id);
                        }
                      }}
                    >
                      {template.id === 'custom' ? (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Customize
                        </>
                      ) : (
                        <>
                          <Info className="h-4 w-4 mr-2" />
                          View All Features
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {previewingTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <previewingTemplate.icon className="h-6 w-6 text-primary" />
                  {previewingTemplate.name} - Features
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {previewingTemplate.description}
                </p>
                <TemplateFeatureExplainer features={previewingTemplate.features} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={customizingCustom} onOpenChange={setCustomizingCustom}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Customize Your Template
            </DialogTitle>
          </DialogHeader>
          <CustomTemplateConfigurator 
            initialFeatures={customConfig?.features}
            initialTerminology={customConfig?.terminology}
            initialLayoutCustomization={customConfig?.layoutCustomization}
            initialAppointmentReasons={customConfig?.appointmentReasons}
            initialServiceCategories={customConfig?.serviceCategories}
            initialQuickAddServices={customConfig?.quickAddServices}
            initialCompletionSteps={customConfig?.completionSteps}
            initialNavigationItems={customConfig?.navigationItems}
            initialAIBehavior={customConfig?.aiBehaviorDefaults}
            initialServiceFieldLabels={customConfig?.serviceFieldLabels}
            onSave={handleCustomSave} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
