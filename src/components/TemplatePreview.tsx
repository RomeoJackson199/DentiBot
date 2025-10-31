import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TemplateType,
  TemplateConfig,
  getTemplateConfig,
  TemplateFeatures,
  TemplateTerminology,
} from '@/lib/businessTemplates';
import {
  Check,
  X,
  AlertTriangle,
  Eye,
  Sparkles,
  Navigation,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplatePreviewProps {
  currentTemplate: TemplateType;
  previewTemplate: TemplateType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSwitch: () => void;
}

export function TemplatePreview({
  currentTemplate,
  previewTemplate,
  open,
  onOpenChange,
  onConfirmSwitch,
}: TemplatePreviewProps) {
  const current = getTemplateConfig(currentTemplate);
  const preview = getTemplateConfig(previewTemplate);

  const featureComparison = Object.keys(current.features).map(key => {
    const featureKey = key as keyof TemplateFeatures;
    return {
      name: key,
      label: getFeatureLabel(featureKey),
      currentValue: current.features[featureKey],
      newValue: preview.features[featureKey],
      changed: current.features[featureKey] !== preview.features[featureKey],
    };
  });

  const featuresGained = featureComparison.filter(f => !f.currentValue && f.newValue);
  const featuresLost = featureComparison.filter(f => f.currentValue && !f.newValue);
  const featuresUnchanged = featureComparison.filter(f => f.currentValue === f.newValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Template Preview: {preview.name}
          </DialogTitle>
          <DialogDescription>
            Compare your current template with the new one before switching
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="terminology">Terms</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] w-full pr-4">
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Template Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{preview.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Current Template</h4>
                      <Badge variant="outline">{current.name}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">New Template</h4>
                      <Badge>{preview.name}</Badge>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Summary of Changes</h4>
                    <div className="space-y-2">
                      {featuresGained.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            <strong className="text-green-600">{featuresGained.length} new features</strong> will be enabled
                          </span>
                        </div>
                      )}
                      {featuresLost.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <span>
                            <strong className="text-amber-600">{featuresLost.length} features</strong> will be hidden (data preserved)
                          </span>
                        </div>
                      )}
                      {featuresUnchanged.filter(f => f.currentValue).length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span>
                            <strong className="text-blue-600">{featuresUnchanged.filter(f => f.currentValue).length} features</strong> remain active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {featuresLost.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <AlertTriangle className="h-4 w-4" />
                      Important: Data Preservation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-amber-900">
                    <p className="mb-2">
                      Switching to this template will <strong>hide</strong> the following features, but your data will be <strong>safely preserved</strong>:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {featuresLost.map(f => (
                        <li key={f.name}>{f.label}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs">
                      💡 You can switch back at any time to access this data again.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Comparison</CardTitle>
                  <CardDescription>
                    See which features are enabled in each template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {featureComparison.map(feature => (
                      <div
                        key={feature.name}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          feature.changed ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'
                        }`}
                      >
                        <span className="font-medium text-sm">{feature.label}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Current:</span>
                            {feature.currentValue ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">New:</span>
                            {feature.newValue ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terminology" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Terminology Changes</CardTitle>
                  <CardDescription>
                    How terms will change in your interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(Object.keys(current.terminology) as (keyof TemplateTerminology)[]).map(key => {
                      const changed = current.terminology[key] !== preview.terminology[key];
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            changed ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'
                          }`}
                        >
                          <span className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{current.terminology[key]}</Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant={changed ? 'default' : 'outline'}>{preview.terminology[key]}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="navigation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Navigation & Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Available menu items and features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Quick-Add Services</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {preview.quickAddServices.map((service, idx) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-muted-foreground">
                              ${service.price} • {service.duration}min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Appointment Reasons</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.appointmentReasons.map((reason, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        AI Assistant Personality
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">{preview.aiBehaviorDefaults.greeting}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.aiBehaviorDefaults.personalityTraits.map((trait, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onConfirmSwitch();
            onOpenChange(false);
          }}>
            <Check className="h-4 w-4 mr-2" />
            Switch to {preview.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getFeatureLabel(feature: keyof TemplateFeatures): string {
  const labels: Record<keyof TemplateFeatures, string> = {
    prescriptions: 'Digital Prescriptions',
    treatmentPlans: 'Treatment/Workout Plans',
    medicalRecords: 'Medical History Records',
    photoUpload: 'Photo Documentation',
    urgencyLevels: 'Urgency/Priority Marking',
    paymentRequests: 'Payment Tracking',
    aiChat: 'AI Booking Assistant',
    appointments: 'Appointment System',
    services: 'Service Management',
  };
  return labels[feature] || feature;
}
