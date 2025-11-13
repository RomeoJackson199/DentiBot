import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BusinessTemplateSelector } from './BusinessTemplateSelector';
import { AIBusinessCreationAssistant } from './business-creation/AIBusinessCreationAssistant';
import { TemplateType } from '@/lib/businessTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, FormInput } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BusinessCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (businessId: string) => void;
}

export function BusinessCreationDialog({ open, onOpenChange, onSuccess }: BusinessCreationDialogProps) {
  const [mode, setMode] = useState<'choice' | 'ai' | 'manual'>('choice');
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('healthcare');
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId as TemplateType);
  };

  const handleTemplateNext = () => {
    if (selectedTemplate) {
      setStep('details');
    }
  };

  const handleBusinessDataUpdate = (data: Partial<{ name?: string; tagline?: string; bio?: string }>) => {
    if (data.name) setBusinessName(data.name);
    if (data.tagline) setTagline(data.tagline);
    if (data.bio) setBio(data.bio);
  };

  const handleAIComplete = async (businessData: { name?: string; tagline?: string; bio?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-healthcare-business', {
        body: {
          name: businessData.name,
          tagline: businessData.tagline || 'Your Practice, Your Way',
          bio: businessData.bio,
          template_type: 'healthcare',
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Business created successfully! 🎉");
        onSuccess(data.business_id);
        onOpenChange(false);

        // Reset form
        setBusinessName("");
        setTagline("");
        setBio("");
        setMode('choice');
      } else {
        throw new Error(data?.error || 'Failed to create business');
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast.error(error.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    setLoading(true);

    try {
      // Call edge function to create business atomically
      const { data, error } = await supabase.functions.invoke('create-healthcare-business', {
        body: {
          name: businessName,
          tagline: tagline || 'Your Practice, Your Way',
          bio: bio,
          template_type: selectedTemplate || 'healthcare',
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Business created successfully!");
        onSuccess(data.business_id);
        onOpenChange(false);

        // Reset form
        setBusinessName("");
        setTagline("");
        setBio("");
        setSelectedTemplate('healthcare');
        setStep('template');
        setMode('choice');
      } else {
        throw new Error(data?.error || 'Failed to create business');
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast.error(error.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {mode === 'choice' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Your Business</DialogTitle>
              <DialogDescription>
                Choose how you'd like to set up your business
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              {/* AI Assistant Option */}
              <button
                onClick={() => setMode('ai')}
                className="group relative overflow-hidden rounded-lg border-2 border-muted hover:border-primary transition-all duration-300 p-6 text-left hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI-Guided Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Chat with our friendly AI assistant who will guide you through the process step-by-step. Perfect if you want a conversational experience!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <span>Recommended for new users</span>
                    <span className="px-2 py-1 bg-primary/10 rounded-full">Easy</span>
                  </div>
                </div>
              </button>

              {/* Manual Form Option */}
              <button
                onClick={() => setMode('manual')}
                className="group relative overflow-hidden rounded-lg border-2 border-muted hover:border-primary transition-all duration-300 p-6 text-left hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                <div className="relative space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <FormInput className="w-6 h-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Traditional Form</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill out a standard form with all the required information. Great if you prefer a straightforward approach!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Classic experience</span>
                    <span className="px-2 py-1 bg-muted rounded-full">Quick</span>
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : mode === 'ai' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Business Setup Assistant
              </DialogTitle>
              <DialogDescription>
                Chat with our AI to set up your business
              </DialogDescription>
            </DialogHeader>

            <AIBusinessCreationAssistant
              onBusinessDataUpdate={handleBusinessDataUpdate}
              onComplete={handleAIComplete}
              businessData={{ name: businessName, tagline, bio }}
            />

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setMode('choice')}>
                Back to Options
              </Button>
            </div>
          </>
        ) : (
          <>
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
                <div className="flex justify-between gap-3">
                  <Button variant="outline" onClick={() => setMode('choice')}>
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleTemplateNext} disabled={!selectedTemplate}>
                      Next
                    </Button>
                  </div>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
