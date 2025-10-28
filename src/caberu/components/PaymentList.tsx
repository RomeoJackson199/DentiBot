import type { FC } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { paymentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Payment } from '../types';

interface PaymentListProps {
  payments: Payment[];
  onRefresh: () => void;
}

export const PaymentList: FC<PaymentListProps> = ({ payments, onRefresh }) => {
  const { token } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async (appointmentId: string) => {
    if (!token) return;
    try {
      const response = await paymentApi.startCheckout(token, appointmentId);
      if (response.url) {
        window.open(response.url, '_blank');
      }
      toast({ title: 'Checkout started', description: response.message ?? 'Complete the payment to confirm.' });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Unable to start payment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.length === 0 && <p className="text-sm text-slate-500">No payments yet.</p>}
        {payments.map((payment) => (
          <div key={payment.id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center">
            <div>
              <p className="font-medium text-slate-700">{payment.appointment?.service?.title ?? 'Service payment'}</p>
              <p className="text-sm text-slate-500">
                {format(new Date(payment.createdAt ?? Date.now()), 'PPpp')} · {payment.method}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-800">${payment.amount.toFixed(2)}</span>
              {payment.status !== 'PAID' && (
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600" onClick={() => handleCheckout(payment.appointmentId)}>
                  Pay now
                </Button>
              )}
              <span className={`text-xs font-medium uppercase ${payment.status === 'PAID' ? 'text-teal-600' : 'text-amber-500'}`}>
                {payment.status}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
