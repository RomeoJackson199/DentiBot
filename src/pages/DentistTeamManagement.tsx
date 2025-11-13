import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import DentistAdminUsers from "./DentistAdminUsers";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DentistTeamManagement() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management"
        subtitle="Manage your clinic's team members and their access levels"
        breadcrumbs={[
          { label: 'Home', href: '/dentist' },
          { label: 'Team' }
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DentistAdminUsers />
        </CardContent>
      </Card>
    </div>
  );
}
