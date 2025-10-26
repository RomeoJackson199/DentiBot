import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { getTemplateConfig, TemplateType } from '@/lib/businessTemplates';
import { Package, ArrowRight } from 'lucide-react';

interface TemplateChangeServicePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: TemplateType;
}

export function TemplateChangeServicePrompt({ 
  open, 
  onOpenChange, 
  templateType 
}: TemplateChangeServicePromptProps) {
  const navigate = useNavigate();
  const template = getTemplateConfig(templateType);

  const handleAddServices = () => {
    onOpenChange(false);
    navigate('/dentist-services');
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add Your {template.terminology.servicePlural}
          </DialogTitle>
          <DialogDescription>
            Get started by adding the {template.terminology.servicePlural.toLowerCase()} you offer. 
            Here are some common {template.terminology.servicePlural.toLowerCase()} for {template.name.toLowerCase()}s:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm font-medium">Suggested {template.terminology.servicePlural}:</div>
          <div className="grid gap-3 md:grid-cols-2">
            {template.quickAddServices.slice(0, 6).map((service, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        €{service.price}
                      </Badge>
                      {service.duration && (
                        <Badge variant="outline" className="text-xs">
                          {service.duration} min
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              You can customize these {template.terminology.servicePlural.toLowerCase()} or add your own 
              when you manage your {template.terminology.servicePlural.toLowerCase()}. 
              {template.terminology.customerPlural} will be able to book these when making appointments.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button onClick={handleAddServices}>
            Add {template.terminology.servicePlural}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
