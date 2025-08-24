import React from "react";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";

export default function PatientAccountPrivacyPage() {
  const { t } = useLanguage();
  const [shareData, setShareData] = React.useState(true);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5" /> {t.pnav.account.privacy}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.pnav.account.privacy}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Share data for better care</Label>
            <Switch checked={shareData} onCheckedChange={setShareData} />
          </div>
          <p className="text-xs text-muted-foreground">You can change your privacy settings anytime.</p>
        </CardContent>
      </Card>
    </div>
  );
}

