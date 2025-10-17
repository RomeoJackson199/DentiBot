import React from "react";
import { FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function PatientDocumentsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2"><FolderOpen className="h-5 w-5" /> {t.pnav.docs.main}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.pnav.docs.main}</CardTitle>
        </CardHeader>
        <CardContent className="space-x-2">
          <Button variant="outline">{t.upload}</Button>
          <Button variant="outline">{t.download}</Button>
          <Button variant="outline">{t.shareLink}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

