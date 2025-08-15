import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { DollarSign, PieChart } from "lucide-react";

export interface PaymentsTabProps {
  patientId: string;
  totalDueCents: number;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ patientId, totalDueCents }) => {
  const due = useMemo(() => totalDueCents > 0, [totalDueCents]);

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Payments
        </h2>
        {due && (
          <Badge className="bg-destructive text-destructive-foreground">Due: €{(totalDueCents/100).toFixed(2)}</Badge>
        )}
      </div>
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <div className="mt-4 space-y-4">
          <TabsContent value="history" className="mt-0">
            <PatientPaymentHistory patientId={patientId} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Payments Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Analytics coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};