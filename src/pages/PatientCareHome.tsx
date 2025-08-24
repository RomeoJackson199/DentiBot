import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Calendar } from "lucide-react";

export default function PatientCareHome() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.pnav.care.home}</h1>
        <Button size="sm" className="gap-2" aria-label={t.bookAppointment}>
          <Calendar className="h-4 w-4" />
          {t.bookAppointment}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Quickly book, view records, and manage payments.</p>
        </CardContent>
      </Card>
    </div>
  );
}

