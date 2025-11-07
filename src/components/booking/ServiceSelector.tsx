import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  requires_upfront_payment: boolean;
  duration_minutes: number | null;
  category: string | null;
}

interface ServiceSelectorProps {
  businessId: string;
  selectedServiceId: string | null;
  onSelectService: (service: Service | null) => void;
}

export function ServiceSelector({
  businessId,
  selectedServiceId,
  onSelectService,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, [businessId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Select a Service</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No services are currently available for booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select a Service</h3>
        {selectedServiceId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectService(null)}
          >
            Clear Selection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          
          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => onSelectService(isSelected ? null : service)}
            >
              <CardHeader>
                {service.image_url && (
                  <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {service.name}
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </CardTitle>
                  {service.requires_upfront_payment && (
                    <Badge variant="default" className="text-xs">
                      Prepay
                    </Badge>
                  )}
                </div>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
                    {formatPrice(service.price_cents, service.currency)}
                  </div>
                  {service.duration_minutes && (
                    <span className="text-sm text-muted-foreground">
                      {service.duration_minutes} min
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
