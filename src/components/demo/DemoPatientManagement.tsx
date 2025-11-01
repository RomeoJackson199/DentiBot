import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus } from "lucide-react";

export function DemoPatientManagement() {
  const patients = [
    { name: "John Smith", email: "john@example.com", phone: "(555) 123-4567", lastVisit: "Oct 28, 2024", status: "Active" },
    { name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 234-5678", lastVisit: "Oct 25, 2024", status: "Active" },
    { name: "Mike Davis", email: "mike@example.com", phone: "(555) 345-6789", lastVisit: "Oct 20, 2024", status: "Active" },
    { name: "Emma Wilson", email: "emma@example.com", phone: "(555) 456-7890", lastVisit: "Oct 15, 2024", status: "Active" },
    { name: "David Brown", email: "david@example.com", phone: "(555) 567-8901", lastVisit: "Oct 10, 2024", status: "Active" },
    { name: "Lisa Anderson", email: "lisa@example.com", phone: "(555) 678-9012", lastVisit: "Oct 5, 2024", status: "Active" },
  ];

  return (
    <div className="p-6 space-y-6" data-tour="patients-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all your patients</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name, email, or phone..."
          className="pl-10"
        />
      </div>

      {/* Patient List */}
      <Card className="p-6">
        <div className="space-y-3">
          {patients.map((patient, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {patient.email} • {patient.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Visit</div>
                  <div className="text-sm font-medium">{patient.lastVisit}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600 font-medium">{patient.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
