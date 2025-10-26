import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceDialog } from './ServiceDialog';
import { Badge } from '@/components/ui/badge';

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

export function ServiceManager() {
  const { businessId, businessName } = useBusinessContext();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (businessId) {
      loadServices();
    }
  }, [businessId]);

  const loadServices = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('Service deleted');
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('business_services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (shouldRefresh: boolean) => {
    setDialogOpen(false);
    setEditingService(null);
    if (shouldRefresh) {
      loadServices();
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please select a business to manage services
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Services & Products</h2>
          <p className="text-muted-foreground mt-1">
            Manage services and products for {businessName}
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first service or product to let customers book appointments
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                {service.image_url && (
                  <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <div className="flex gap-1">
                    {!service.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {service.requires_upfront_payment && (
                      <Badge variant="default">Prepay</Badge>
                    )}
                  </div>
                </div>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(service.price_cents, service.currency)}
                  </div>
                  {service.duration_minutes && (
                    <span className="text-sm text-muted-foreground">
                      {service.duration_minutes} min
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(service)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(service.id, service.is_active)}
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        service={editingService}
        businessId={businessId}
      />
    </div>
  );
}
