import { TemplateType } from '@/lib/businessTemplates';
import { BusinessTemplateSelector } from '@/components/BusinessTemplateSelector';
import { FullTemplateConfig } from '@/components/CustomTemplateConfigurator';

interface BusinessTemplateStepProps {
  selectedTemplate?: TemplateType;
  onSelect: (template: TemplateType, customConfig?: FullTemplateConfig) => void;
}

export function BusinessTemplateStep({ selectedTemplate, onSelect }: BusinessTemplateStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose Your Business Template</h2>
        <p className="text-muted-foreground mt-2">
          Select the template that best matches your business type
        </p>
      </div>

      <BusinessTemplateSelector
        selectedTemplate={selectedTemplate}
        onSelect={onSelect}
      />
    </div>
  );
}
