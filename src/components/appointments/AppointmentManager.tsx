// Stub: needs rebuild for new schema
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Export dummy Appointment type for backwards compatibility
export interface Appointment {
  id: string;
  [key: string]: any;
}

export const AppointmentManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-500" />
        Needs Rebuild
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">See MIGRATION_TO_MULTI_BUSINESS.md</p>
    </CardContent>
  </Card>
);
