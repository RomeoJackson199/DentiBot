import React, { useMemo, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { DollarSign, PieChart, CreditCard, AlertCircle, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';

export interface PaymentsTabProps {
  patientId: string;
  totalDueCents: number;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ patientId, totalDueCents }) => {
  const due = useMemo(() => totalDueCents > 0, [totalDueCents]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [sendingStatement, setSendingStatement] = useState(false);

  const handlePayAll = async () => {
    try {
      setIsProcessing(true);
      
      // Get all pending payment requests
      const { data: pendingPayments, error: fetchError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['pending','overdue']);
      
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
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">
                  Outstanding Balance
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  You have €{(totalDueCents/100).toFixed(2)} in pending payments. 
                  Click "Pay All" above to settle all outstanding amounts at once.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900">
                  All Paid Up!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  You don't have any outstanding payments. Great job staying on top of your bills!
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="outline" disabled={sendingStatement}
                    onClick={async () => {
                      try {
                        setSendingStatement(true);
                        const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
                          body: { payment_request_ids: [], template_key: 'statement' }
                        });
                        if (error) throw error;
                        toast({ title: 'Statement sent', description: 'A statement has been emailed to you.' });
                      } catch (e) {
                        toast({ title: 'Error', description: 'Failed to send statement', variant: 'destructive' });
                      } finally {
                        setSendingStatement(false);
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" /> Send statement
                  </Button>
                </div>
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
          <TabsTrigger value="analytics" className="flex-1 sm:flex-initial">
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="history" className="mt-0">
            <PatientPaymentHistory patientId={patientId} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Payment Analytics
                </CardTitle>
                <CardDescription>
                  Track your payment history and spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment Summary Chart */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">€2,340</div>
                          <div className="text-sm text-muted-foreground">Total Paid This Year</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">€180</div>
                          <div className="text-sm text-muted-foreground">Average Per Visit</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Breakdown */}
                  <div>
                    <h4 className="font-semibold mb-3">Monthly Spending</h4>
                    <div className="space-y-2">
                      {[
                        { month: "December 2024", amount: 280, treatments: ["Cleaning", "Check-up"] },
                        { month: "November 2024", amount: 450, treatments: ["Filling", "X-ray"] },
                        { month: "October 2024", amount: 120, treatments: ["Consultation"] },
                        { month: "September 2024", amount: 600, treatments: ["Root Canal", "Crown"] },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{item.month}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.treatments.join(", ")}
                            </div>
                          </div>
                          <div className="font-bold">€{item.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Treatment Categories */}
                  <div>
                    <h4 className="font-semibold mb-3">Spending by Category</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { category: "Preventive Care", amount: 680, percentage: 29 },
                        { category: "Restorative", amount: 1200, percentage: 51 },
                        { category: "Emergency", amount: 320, percentage: 14 },
                        { category: "Cosmetic", amount: 140, percentage: 6 },
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <div className="text-lg font-bold">€{item.amount}</div>
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                          <div className="text-xs text-blue-600">{item.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};