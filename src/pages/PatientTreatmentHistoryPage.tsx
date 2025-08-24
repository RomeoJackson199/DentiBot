import React from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

export default function PatientTreatmentHistoryPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> {t.pnav.care.history}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.pnav.care.history}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your treatments and visits will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

