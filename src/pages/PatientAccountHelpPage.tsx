import React from "react";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function PatientAccountHelpPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><HelpCircle className="h-5 w-5" /> {t.pnav.account.help}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.pnav.account.help}</CardTitle>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button asChild><a href="/support">{t.contactSupport}</a></Button>
          <Button variant="outline" asChild><a href="/privacy">{t.privacyPolicyLink}</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}

