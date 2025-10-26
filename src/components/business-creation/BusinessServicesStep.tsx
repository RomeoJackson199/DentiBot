import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { TemplateType, getTemplateConfig } from '@/lib/businessTemplates';

interface Service {
  name: string;
  price: number;
  duration?: number;
}

interface BusinessServicesStepProps {
  services: Service[];
  template?: TemplateType;
  onUpdate: (services: Service[]) => void;
}

export function BusinessServicesStep({ services, template, onUpdate }: BusinessServicesStepProps) {
  const [localServices, setLocalServices] = useState<Service[]>(services.length > 0 ? services : [{ name: '', price: 0, duration: 30 }]);

  const templateConfig = template ? getTemplateConfig(template) : null;
  const quickAddServices = templateConfig?.quickAddServices || [];

  const addService = () => {
    const newServices = [...localServices, { name: '', price: 0, duration: 30 }];
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const removeService = (index: number) => {
    const newServices = localServices.filter((_, i) => i !== index);
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const newServices = [...localServices];
    newServices[index] = { ...newServices[index], [field]: value };
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const addQuickService = (quickService: any) => {
    const newServices = [...localServices, quickService];
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Add Your Services</h2>
        <p className="text-muted-foreground mt-2">
          Define the services you offer and their pricing
        </p>
      </div>

      {quickAddServices.length > 0 && (
        <div className="mb-6">
          <Label className="mb-3 block">Quick Add Common Services</Label>
          <div className="flex flex-wrap gap-2">
            {quickAddServices.map((service, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => addQuickService(service)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {service.name} - ${service.price}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {localServices.map((service, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`service-name-${index}`}>Service Name</Label>
                  <Input
                    id={`service-name-${index}`}
                    placeholder="e.g., Haircut, Consultation"
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`service-price-${index}`}>Price ($)</Label>
                    <Input
                      id={`service-price-${index}`}
                      type="number"
                      placeholder="0.00"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`service-duration-${index}`}>Duration (min)</Label>
                    <Input
                      id={`service-duration-${index}`}
                      type="number"
                      placeholder="30"
                      value={service.duration || ''}
                      onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeService(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={addService} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Another Service
      </Button>
    </div>
  );
}
