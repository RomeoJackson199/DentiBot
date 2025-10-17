import React from "react";
import { IdCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function PatientAccountInsurancePage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><IdCard className="h-5 w-5" /> {t.pnav.account.insurance}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.pnav.account.insurance}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t.insuranceProvider}</Label>
            <Input placeholder={t.insuranceProviderPlaceholder} />
          </div>
          <div>
            <Label>{t.policyNumber}</Label>
            <Input placeholder={t.policyNumberPlaceholder} />
          </div>
          <Button>{t.save}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

