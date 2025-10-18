// This component needs to be rebuilt for the new multi-business schema
// See MIGRATION_TO_MULTI_BUSINESS.md for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export const AppointmentBooking = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Component Needs Rebuild
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This component was built for the old dentist-specific schema.
          It needs to be rebuilt to work with the new multi-business platform.
          See <code>MIGRATION_TO_MULTI_BUSINESS.md</code> for details.
        </p>
      </CardContent>
    </Card>
  );
};
