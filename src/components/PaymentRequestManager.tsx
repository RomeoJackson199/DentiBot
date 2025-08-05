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
        .select('*')
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
      paid: 'secondary',
      cancelled: 'destructive',
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    } as const;

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'default'}
        className={`${colors[status as keyof typeof colors] || colors.pending} font-medium px-3 py-1`}
      >
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-dental-primary mb-2">Payment Requests</h2>
          <p className="text-dental-text/70">Manage and track patient payment requests</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-dental-accent to-dental-accent/80 hover:from-dental-accent/90 hover:to-dental-accent/70 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Payment Request
        </Button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-dental-primary/5 to-dental-accent/5 rounded-xl p-1 shadow-lg">
          <PaymentRequestForm
            dentistId={dentistId}
            onClose={() => {
              setShowForm(false);
              fetchPaymentRequests();
            }}
          />
        </div>
      )}

      <div className="grid gap-6">
        {paymentRequests.length === 0 ? (
          <Card className="bg-gradient-to-br from-dental-primary/5 to-dental-accent/5 border-dental-primary/20">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-16 w-16 mx-auto text-dental-primary/30 mb-6" />
              <h3 className="text-xl font-semibold text-dental-primary mb-2">No payment requests yet</h3>
              <p className="text-dental-text/60 mb-6">Create your first payment request to get started</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-dental-accent to-dental-accent/80 hover:from-dental-accent/90 hover:to-dental-accent/70 text-white font-semibold px-6 py-3"
              >
                Create Payment Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentRequests.map((request) => (
            <Card key={request.id} className="bg-gradient-to-br from-white to-dental-primary/5 border-dental-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-dental-primary/10">
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dental-primary text-lg mb-1">
                        {request.patient_email}
                      </h3>
                      <p className="text-dental-text/80 mb-1">
                        {request.description}
                      </p>
                      <p className="text-xs text-dental-text/50 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Created {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-2xl text-dental-primary mb-3">{formatAmount(request.amount)}</p>
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