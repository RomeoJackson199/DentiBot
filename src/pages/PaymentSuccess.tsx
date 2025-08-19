import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('update-payment-status', {
            body: { session_id: sessionId }
          });
          
          if (error) {
            console.error('Error updating payment status:', error);
          } else {
            console.log('Payment status updated:', data);
          }
        } catch (error) {
          console.error('Failed to update payment status:', error);
        }
      }
    };

    updatePaymentStatus();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>
          
          {sessionId && (
            <p className="text-sm text-muted-foreground">
              Transaction ID: {sessionId.slice(0, 20)}...
            </p>
          )}

          <Button 
            onClick={() => window.close()}
            className="w-full"
          >
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;