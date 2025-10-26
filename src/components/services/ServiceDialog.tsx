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
import { Upload, X } from 'lucide-react';

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
}

export function ServiceDialog({ open, onClose, service, businessId }: ServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    duration_minutes: '60',
    category: '',
    requires_upfront_payment: false,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        price: (service.price_cents / 100).toString(),
        currency: service.currency,
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
        currency: 'USD',
        duration_minutes: '60',
        category: '',
        requires_upfront_payment: false,
        is_active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [service, open]);

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

    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const imageUrl = await uploadImage();
      const priceCents = Math.round(parseFloat(formData.price) * 100);

      const serviceData = {
        business_id: businessId,
        name: formData.name,
        description: formData.description || null,
        price_cents: priceCents,
        currency: formData.currency,
        image_url: imageUrl,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        category: formData.category || null,
        requires_upfront_payment: formData.requires_upfront_payment,
        is_active: formData.is_active,
      };

      if (service) {
        const { error } = await supabase
          .from('business_services')
          .update(serviceData)
          .eq('id', service.id);

        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        const { error } = await supabase
          .from('business_services')
          .insert(serviceData);

        if (error) throw error;
        toast.success('Service created successfully');
      }

      onClose(true);
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Men's Haircut, Consultation, Teeth Cleaning"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this service..."
              rows={3}
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </div>

          {/* Duration and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Hair, Consultation"
              />
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
