import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { DollarSign, AlertCircle, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';

export interface PaymentsTabProps {
  patientId: string;
  totalDueCents: number;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ patientId, totalDueCents }) => {
  const due = useMemo(() => totalDueCents > 0, [totalDueCents]);
  const { toast } = useToast();
  const [sendingStatement, setSendingStatement] = useState(false);

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
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

      {/* Payment History */}
      <div className="mt-6">
        <PatientPaymentHistory patientId={patientId} />
      </div>
    </div>
  );
};