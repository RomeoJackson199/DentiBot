import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface WalkInFlowProps {
  businessId: string;
  onComplete?: () => void;
}

export function WalkInFlow({ businessId, onComplete }: WalkInFlowProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 2,
    tableId: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ['available-tables', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('business_id', businessId)
        .order('table_number');

      if (error) throw error;
      return data;
    }
  });

  const seatWalkIn = async () => {
    if (!formData.customerName || !formData.tableId) {
      toast({
        title: 'Missing information',
        description: 'Please enter customer name and select a table',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Get current waiter profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Create or find customer profile (guest)
      const nameParts = formData.customerName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      let customerId: string;

      // Check if customer exists by phone or email
      if (formData.customerPhone || formData.customerEmail) {
        const { data: existingCustomer } = await supabase
          .from('profiles')
          .select('id')
          .or(`phone.eq.${formData.customerPhone || ''},email.eq.${formData.customerEmail || ''}`)
          .limit(1)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new guest profile
          const { data: newCustomer, error: profileError } = await supabase
            .from('profiles')
            .insert({
              first_name: firstName,
              last_name: lastName,
              phone: formData.customerPhone || null,
              email: formData.customerEmail || null,
            })
            .select()
            .single();

          if (profileError) throw profileError;
          customerId = newCustomer.id;
        }
      } else {
        // Create guest profile without contact info
        const { data: newCustomer, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: firstName,
            last_name: lastName,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        customerId = newCustomer.id;
      }

      // Create appointment for walk-in (right now)
      const now = new Date();
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert({
          business_id: businessId,
          patient_id: customerId,
          dentist_id: profile?.id, // Assign to current waiter
          appointment_date: now.toISOString(),
          reason: 'Walk-in Dining',
          duration_minutes: 90,
          status: 'confirmed',
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Create table reservation (immediately seated)
      const { error: reservationError } = await supabase
        .from('table_reservations')
        .insert({
          appointment_id: appointment.id,
          table_id: formData.tableId,
          party_size: formData.partySize,
          special_requests: formData.specialRequests,
          reservation_status: 'seated',
          seated_at: now.toISOString(),
          assigned_waiter_id: profile?.id
        });

      if (reservationError) throw reservationError;

      toast({
        title: 'Walk-in seated!',
        description: `${formData.customerName} seated at table ${tables?.find(t => t.id === formData.tableId)?.table_number}`
      });

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        partySize: 2,
        tableId: '',
        specialRequests: ''
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      toast({
        title: 'Error seating walk-in',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Seat Walk-In Customer
        </CardTitle>
        <CardDescription>
          For customers without reservations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            placeholder="John Doe"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone (optional)</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email (optional)</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="john@example.com"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </div>
        </div>

        {/* Party Size */}
        <div className="space-y-2">
          <Label htmlFor="partySize">Party Size</Label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
              <Button
                key={size}
                variant={formData.partySize === size ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, partySize: size })}
              >
                {size}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min="1"
            placeholder="Or enter custom size"
            value={formData.partySize}
            onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
          />
        </div>

        {/* Table Selection */}
        <div className="space-y-2">
          <Label htmlFor="tableId">Assign Table *</Label>
          <Select value={formData.tableId} onValueChange={(value) => setFormData({ ...formData, tableId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables
                ?.filter(t => t.capacity >= formData.partySize)
                .map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Table {table.table_number} (Capacity: {table.capacity})
                    {table.location_notes && ` - ${table.location_notes}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Showing tables with capacity ≥ {formData.partySize}
          </p>
        </div>

        {/* Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="specialRequests">Special Requests (optional)</Label>
          <Textarea
            id="specialRequests"
            placeholder="Allergies, birthday, preferences..."
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={3}
          />
        </div>

        {/* Seat Button */}
        <Button
          onClick={seatWalkIn}
          disabled={loading || !formData.customerName || !formData.tableId}
          className="w-full"
          size="lg"
        >
          {loading ? (
            'Seating...'
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Seat Customer
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
