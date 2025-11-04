import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { QuickCheckout } from './QuickCheckout';
import { ShoppingBag, User, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { logger } from '@/lib/logger';

interface InStoreCustomer {
  appointmentId: string;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  stylistId: string;
  stylistName: string;
  startTime: Date;
}

interface CheckoutListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutList({ open, onOpenChange }: CheckoutListProps) {
  const { businessId } = useBusinessContext();
  const [customers, setCustomers] = useState<InStoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<InStoreCustomer | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      loadInStoreCustomers();
    }
  }, [open, businessId]);

  const loadInStoreCustomers = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          appointment_date,
          dentist_id,
          service_id,
          dentists(
            id,
            profiles(first_name, last_name)
          ),
          business_services(
            name,
            price_cents
          )
        `)
        .eq('business_id', businessId)
        .eq('status', 'in_progress')
        .order('appointment_date');

      if (error) {
        logger.error('Failed to load in-store customers', error);
        throw error;
      }

      if (data) {
        const formattedCustomers: InStoreCustomer[] = data
          .filter((appt) => appt.business_services && appt.dentists)
          .map((appt: any) => ({
            appointmentId: appt.id,
            clientName: appt.patient_name || 'Walk-in',
            serviceName: appt.business_services.name,
            servicePrice: appt.business_services.price_cents / 100,
            stylistId: appt.dentist_id,
            stylistName: appt.dentists.profiles
              ? `${appt.dentists.profiles.first_name} ${appt.dentists.profiles.last_name}`
              : 'Stylist',
            startTime: new Date(appt.appointment_date),
          }));

        setCustomers(formattedCustomers);
      }
    } catch (error) {
      logger.error('Error loading in-store customers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = (customer: InStoreCustomer) => {
    setSelectedCustomer(customer);
    setShowCheckout(true);
    onOpenChange(false); // Close the list dialog
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    setSelectedCustomer(null);
    // Don't reopen the list, just refresh data for next time
    loadInStoreCustomers();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBag className="h-6 w-6" />
              Customers Ready for Checkout
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <ModernLoadingSpinner size="lg" message="Loading customers..." />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  No customers in store
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add walk-ins or wait for appointments to start
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {customers.map((customer) => (
                  <Card
                    key={customer.appointmentId}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {customer.clientName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {customer.serviceName} • €{customer.servicePrice.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {customer.stylistName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Started {format(customer.startTime, 'h:mm a')}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="lg"
                          className="ml-4 gap-2"
                          onClick={() => handleCheckoutClick(customer)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Check Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      {showCheckout && selectedCustomer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <QuickCheckout
              appointmentId={selectedCustomer.appointmentId}
              clientName={selectedCustomer.clientName}
              stylistId={selectedCustomer.stylistId}
              stylistName={selectedCustomer.stylistName}
              servicePrice={selectedCustomer.servicePrice}
              serviceName={selectedCustomer.serviceName}
              onComplete={handleCheckoutComplete}
              onCancel={() => {
                setShowCheckout(false);
                setSelectedCustomer(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
