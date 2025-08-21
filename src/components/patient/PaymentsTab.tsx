import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { DollarSign, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentsTabProps {
  patientId: string;
  totalDueCents: number;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ patientId, totalDueCents }) => {
  const due = useMemo(() => totalDueCents > 0, [totalDueCents]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayAll = async () => {
    try {
      setIsProcessing(true);
      
      // Get all pending payment requests
      const { data: pendingPayments, error: fetchError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'pending');
      
      if (fetchError) throw fetchError;
      
      if (!pendingPayments || pendingPayments.length === 0) {
        toast({
          title: "No pending payments",
          description: "You don't have any outstanding payments.",
        });
        return;
      }
      
      // Calculate total amount
      const totalAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Create a combined payment session
      const { data, error } = await supabase.functions.invoke('create-payment-request', {
        body: {
          patient_id: patientId,
          amount: totalAmount,
          description: `Combined payment for ${pendingPayments.length} outstanding item(s)`,
          payment_request_ids: pendingPayments.map(p => p.id)
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      {/* Header with Pay All button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payments
          </h2>
          {due && (
            <p className="text-sm text-muted-foreground mt-1">
              Total outstanding: €{(totalDueCents/100).toFixed(2)}
            </p>
          )}
        </div>
        
        {due && (
          <Button 
            onClick={handlePayAll}
            disabled={isProcessing}
            size="lg"
            className="w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : `Pay All (€${(totalDueCents/100).toFixed(2)})`}
          </Button>
        )}
      </div>

      {/* Payment Status Card */}
      {due ? (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 dark:text-orange-100">
                  Outstanding Balance
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                  You have €{(totalDueCents/100).toFixed(2)} in pending payments. 
                  Click "Pay All" above to settle all outstanding amounts at once.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  All Paid Up!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                  You don't have any outstanding payments. Great job staying on top of your bills!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="history" className="flex-1 sm:flex-initial">
            Payment History
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="history" className="mt-0">
            <PatientPaymentHistory patientId={patientId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};