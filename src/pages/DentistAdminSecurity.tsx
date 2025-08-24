import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DentistAdminSecurity() {
  return (
    <div className="p-3 md:p-4 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Security settings coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

