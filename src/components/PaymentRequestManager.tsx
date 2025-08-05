import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PaymentRequestForm } from '@/components/PaymentRequestForm';
import { useToast } from '@/hooks/use-toast';

interface PaymentRequest {
  id: string;
  patient_id: string;
  dentist_id: string;
  amount: number;
  description: string;
  status: string;
  patient_email: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

interface PaymentRequestManagerProps {
  dentistId: string;
}

export const PaymentRequestManager: React.FC<PaymentRequestManagerProps> = ({ dentistId }) => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentRequests();
  }, [dentistId]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          patient:profiles!payment_requests_patient_id_fkey(first_name, last_name)
        `)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load payment requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      paid: 'success',
      cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number) => {
    return `€${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payment requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Requests</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Payment Request
        </Button>
      </div>

      {showForm && (
        <PaymentRequestForm
          patientId={selectedPatient?.id || ''}
          patientName={selectedPatient?.name || ''}
          patientEmail={selectedPatient?.email || ''}
          onClose={() => {
            setShowForm(false);
            setSelectedPatient(null);
            fetchPaymentRequests();
          }}
        />
      )}

      <div className="grid gap-4">
        {paymentRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payment requests yet</p>
            </CardContent>
          </Card>
        ) : (
          paymentRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-medium">
                        {request.patient?.first_name} {request.patient?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {request.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatAmount(request.amount)}</p>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};