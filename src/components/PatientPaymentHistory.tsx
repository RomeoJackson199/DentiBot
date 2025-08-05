import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentRequest {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  stripe_session_id?: string;
  dentist?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

interface PatientPaymentHistoryProps {
  patientId: string;
}

export const PatientPaymentHistory: React.FC<PatientPaymentHistoryProps> = ({ patientId }) => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, [patientId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          dentist:dentists!payment_requests_dentist_id_fkey(
            profile:profiles!dentists_profile_id_fkey(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
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

  const handlePayNow = async (stripeSessionId: string) => {
    if (stripeSessionId) {
      // Redirect to Stripe checkout (this would need the actual session URL)
      window.open(`https://checkout.stripe.com/pay/${stripeSessionId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading payment history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentRequests.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No payment requests found
            </div>
          ) : (
            paymentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <h4 className="font-medium">{request.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      From: Dr. {request.dentist?.profile?.first_name} {request.dentist?.profile?.last_name}
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
                  {request.status === 'pending' && request.stripe_session_id && (
                    <Button
                      size="sm"
                      onClick={() => handlePayNow(request.stripe_session_id!)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};