import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BusinessTemplateSelector } from './BusinessTemplateSelector';
import { TemplateType } from '@/lib/businessTemplates';
import { FullTemplateConfig } from './CustomTemplateConfigurator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BusinessCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (businessId: string) => void;
}

export function BusinessCreationDialog({ open, onOpenChange, onSuccess }: BusinessCreationDialogProps) {
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('healthcare');
  const [customConfig, setCustomConfig] = useState<FullTemplateConfig | undefined>();
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (
    templateId: string,
    config?: FullTemplateConfig
  ) => {
    setSelectedTemplate(templateId as TemplateType);
    if (config) setCustomConfig(config);
  };

  const handleTemplateNext = () => {
    if (selectedTemplate) {
      setStep('details');
    }
  };

  const handleCreate = async () => {
    if (!businessName.trim()) {
      toast.error('Please enter a business name');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Generate slug
      const baseSlug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let slug = baseSlug;
      let slugExists = true;
      let counter = 1;

      // Find unique slug
      while (slugExists) {
        const { data } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (!data) {
          slugExists = false;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Create business
      const businessData: any = {
        name: businessName,
        slug,
        tagline: tagline || null,
        owner_profile_id: profile.id,
        template_type: selectedTemplate,
      };

      // Store custom configuration if template is custom
      if (selectedTemplate === 'custom' && customConfig) {
        businessData.custom_features = customConfig.features;
        businessData.custom_terminology = customConfig.terminology;
        businessData.custom_config = customConfig;
      }

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert(businessData)
        .select()
        .single();

      if (businessError) throw businessError;

      // Add owner as business member
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          profile_id: profile.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Assign admin and provider roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: user.id,
            role: 'admin',
          },
          {
            user_id: user.id,
            role: 'provider',
          }
        ]);

      // Ignore if roles already exist
      if (roleError && !roleError.message.includes('duplicate') && !roleError.message.includes('unique')) {
        throw roleError;
      }

      toast.success('Business created successfully!');
      onSuccess(business.id);
      onOpenChange(false);

      // Reset form
      setStep('template');
      setSelectedTemplate('healthcare');
      setBusinessName('');
      setTagline('');
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast.error(error.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'template' ? 'Choose Your Business Template' : 'Business Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'template' 
              ? 'Select the template that best matches your business type'
              : 'Enter your business information'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'template' ? (
          <div className="space-y-6">
            <BusinessTemplateSelector
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleTemplateNext} disabled={!selectedTemplate}>
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline (Optional)</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Your smile is our priority"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('template')}
                disabled={loading}
              >
                Back
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading || !businessName.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Business'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
