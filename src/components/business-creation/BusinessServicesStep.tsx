import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { TemplateType, getTemplateConfig } from '@/lib/businessTemplates';
import { serviceCreationSchema } from '@/lib/validationSchemas';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Service {
  name: string;
  price: number;
  duration?: number;
  description?: string;
  category?: string;
}

interface BusinessServicesStepProps {
  services: Service[];
  template?: TemplateType;
  onUpdate: (services: Service[]) => void;
}

export function BusinessServicesStep({ services, template, onUpdate }: BusinessServicesStepProps) {
  const [localServices, setLocalServices] = useState<Service[]>(
    services.length > 0 ? services : []
  );
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Update local state when services prop changes (from AI suggestions)
  useEffect(() => {
    if (services.length > 0 && JSON.stringify(services) !== JSON.stringify(localServices)) {
      setLocalServices(services);
    }
  }, [services]);

  const templateConfig = template ? getTemplateConfig(template) : null;
  const quickAddServices = templateConfig?.quickAddServices || [];
  const categories = templateConfig?.serviceCategories || [];
  const fieldLabels = templateConfig?.serviceFieldLabels || {
    serviceName: 'Service Name',
    serviceNamePlaceholder: 'e.g., Consultation, Service',
    descriptionPlaceholder: 'Describe what\'s included...',
    categoryLabel: 'Category',
    durationLabel: 'Duration (minutes)',
  };

  const validateService = (service: Service, index: number): boolean => {
    try {
      serviceCreationSchema.parse(service);
      // Clear errors for this service
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const serviceErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          serviceErrors[path] = err.message;
        });
        setErrors({ ...errors, [index]: serviceErrors });
      }
      return false;
    }
  };

  const addService = () => {
    const newServices = [...localServices, { name: '', price: 0, duration: 30, description: '', category: '' }];
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const removeService = (index: number) => {
    const newServices = localServices.filter((_, i) => i !== index);
    // Remove errors for this service and reindex
    const newErrors = { ...errors };
    delete newErrors[index];
    // Reindex remaining errors
    const reindexedErrors: Record<number, Record<string, string>> = {};
    Object.keys(newErrors).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum > index) {
        reindexedErrors[keyNum - 1] = newErrors[keyNum];
      } else {
        reindexedErrors[keyNum] = newErrors[keyNum];
      }
    });
    setErrors(reindexedErrors);
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const newServices = [...localServices];
    newServices[index] = { ...newServices[index], [field]: value };
    setLocalServices(newServices);
    onUpdate(newServices);

    // Clear error for this field
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const addQuickService = (quickService: any) => {
    const newServices = [...localServices, quickService];
    setLocalServices(newServices);
    onUpdate(newServices);
  };

  const servicePlural = templateConfig?.terminology.servicePlural || 'Services';

  const hasValidServices = localServices.some(s => s.name.trim() && s.price > 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">Add Your {servicePlural}</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About {servicePlural}</DialogTitle>
                <DialogDescription className="space-y-2 text-left">
                  <p>
                    Define the {servicePlural.toLowerCase()} or offerings you provide to your customers.
                    Each service should include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Name:</strong> Clear, descriptive title</li>
                    <li><strong>Price:</strong> How much you charge</li>
                    <li><strong>Duration:</strong> Estimated time needed (optional)</li>
                    <li><strong>Description:</strong> What's included or what to expect</li>
                  </ul>
                  <p className="mt-3">
                    You can always add or modify services later from your dashboard.
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Define the {servicePlural.toLowerCase()} you offer and their pricing
        </p>
      </div>

      {quickAddServices.length > 0 && (
        <div className="mb-6">
          <Label className="mb-3 block">Quick Add Common {servicePlural}</Label>
          <div className="flex flex-wrap gap-2">
            {quickAddServices.map((service, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => addQuickService(service)}
                className="text-left"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span className="truncate">{service.name} - €{service.price}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {localServices.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">No services added yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start by adding your first service or use quick add options above
              </p>
            </div>
            <Button onClick={addService} className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Service
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {localServices.map((service, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`service-name-${index}`}>{fieldLabels.serviceName} *</Label>
                  <Input
                    id={`service-name-${index}`}
                    placeholder={fieldLabels.serviceNamePlaceholder}
                    value={service.name}
                    onChange={(e) => updateService(index, 'name', e.target.value)}
                    className={errors[index]?.name ? 'border-red-500' : ''}
                  />
                  {errors[index]?.name && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors[index].name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`service-description-${index}`}>Description</Label>
                  <Textarea
                    id={`service-description-${index}`}
                    placeholder={fieldLabels.descriptionPlaceholder}
                    value={service.description || ''}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    rows={2}
                    className={errors[index]?.description ? 'border-red-500' : ''}
                  />
                  {errors[index]?.description && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors[index].description}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`service-price-${index}`}>Price (€) *</Label>
                    <Input
                      id={`service-price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={service.price || ''}
                      onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                      className={errors[index]?.price ? 'border-red-500' : ''}
                    />
                    {errors[index]?.price && (
                      <div className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors[index].price}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`service-duration-${index}`}>{fieldLabels.durationLabel}</Label>
                    <Input
                      id={`service-duration-${index}`}
                      type="number"
                      min="5"
                      max="480"
                      placeholder="30"
                      value={service.duration || ''}
                      onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || undefined)}
                      className={errors[index]?.duration ? 'border-red-500' : ''}
                    />
                    {errors[index]?.duration && (
                      <div className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors[index].duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`service-category-${index}`}>{fieldLabels.categoryLabel}</Label>
                  {categories.length > 0 ? (
                    <Select
                      value={service.category || ''}
                      onValueChange={(value) => updateService(index, 'category', value)}
                    >
                      <SelectTrigger className={errors[index]?.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`service-category-${index}`}
                      placeholder="e.g., Standard, Premium"
                      value={service.category || ''}
                      onChange={(e) => updateService(index, 'category', e.target.value)}
                      className={errors[index]?.category ? 'border-red-500' : ''}
                    />
                  )}
                  {errors[index]?.category && (
                    <div className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors[index].category}</span>
                    </div>
                  )}
                </div>
              </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeService(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={localServices.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {localServices.length > 0 && (
        <Button onClick={addService} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Another {templateConfig?.terminology.service || 'Service'}
        </Button>
      )}

      {!hasValidServices && localServices.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Please add at least one service with a name and price to continue
          </p>
        </div>
      )}
    </div>
  );
}
