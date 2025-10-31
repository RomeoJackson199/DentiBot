import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { sanitizeServiceData, serviceCreationSchema } from '@/lib/validationSchemas';
import { z } from 'zod';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  requires_upfront_payment: boolean;
  is_active: boolean;
  duration_minutes: number | null;
  category: string | null;
}

interface ServiceDialogProps {
  open: boolean;
  onClose: (shouldRefresh: boolean) => void;
  service: Service | null;
  businessId: string;
  defaultCategory?: string;
}

export function ServiceDialog({ open, onClose, service, businessId, defaultCategory }: ServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    duration_minutes: '60',
    category: '',
    requires_upfront_payment: false,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        price: (service.price_cents / 100).toString(),
        currency: 'EUR',
        duration_minutes: service.duration_minutes?.toString() || '60',
        category: service.category || '',
        requires_upfront_payment: service.requires_upfront_payment,
        is_active: service.is_active,
      });
      setImagePreview(service.image_url);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        currency: 'EUR',
        duration_minutes: '60',
        category: defaultCategory ?? '',
        requires_upfront_payment: false,
        is_active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
    }, [service, open, defaultCategory]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return service?.image_url || null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${businessId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('dental-photos')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dental-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      const validationData = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price) || 0,
        duration: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        category: formData.category || undefined,
      };

      const validated = serviceCreationSchema.parse(validationData);

      setSaving(true);

      // Upload image if provided
      const imageUrl = await uploadImage();
      if (imageFile && !imageUrl) {
        throw new Error('Image upload failed');
      }

      const priceCents = Math.round(validated.price * 100);

      // Sanitize the data
      const serviceData = sanitizeServiceData({
        business_id: businessId,
        name: validated.name,
        description: validated.description || null,
        price_cents: priceCents,
        currency: 'EUR',
        image_url: imageUrl,
        duration_minutes: validated.duration || null,
        category: validated.category || null,
        requires_upfront_payment: formData.requires_upfront_payment,
        is_active: formData.is_active,
      });

      if (service) {
        const { error } = await supabase
          .from('business_services')
          .update(serviceData)
          .eq('id', service.id);

        if (error) {
          console.error('Database error:', error);
          throw new Error(error.message || 'Failed to update service');
        }
        toast.success('Service updated successfully');
        logger.info('Service updated', { serviceId: service.id });
      } else {
        const { error, data } = await supabase
          .from('business_services')
          .insert(serviceData)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          throw new Error(error.message || 'Failed to create service');
        }
        toast.success('Service created successfully');
        logger.info('Service created', { serviceId: data?.id });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Error saving service:', error);

      if (error instanceof z.ZodError) {
        // Handle validation errors
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else {
        // Handle other errors
        const errorMessage = error.message || 'Failed to save service';
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {service
              ? 'Update service details and pricing'
              : 'Create a new service or product for customers to book'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Service Image (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" className="mt-2" asChild>
                  <span>{imagePreview ? 'Change Image' : 'Upload Image'}</span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g., Men's Haircut, Consultation, Teeth Cleaning"
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              placeholder="Describe what's included in this service..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.description}</span>
              </div>
            )}
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: '' });
                }}
                placeholder="0.00"
                required
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.price}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value="EUR" disabled className="bg-muted/40" />
              <p className="text-xs text-muted-foreground">
                All prices are standardised in Euro for a consistent patient experience.
              </p>
            </div>
          </div>

          {/* Duration and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => {
                  setFormData({ ...formData, duration_minutes: e.target.value });
                  if (errors.duration) setErrors({ ...errors, duration: '' });
                }}
                placeholder="60"
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.duration}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: '' });
                }}
                placeholder="e.g., Whitening, Aligners, Product"
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="upfront-payment">Require Upfront Payment</Label>
                <p className="text-sm text-muted-foreground">
                  Customers must pay before booking (requires Stripe)
                </p>
              </div>
              <Switch
                id="upfront-payment"
                checked={formData.requires_upfront_payment}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_upfront_payment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this service available for booking
                </p>
              </div>
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving || uploading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
