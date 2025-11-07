import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Plus, Mail, Phone } from "lucide-react";

export function DemoStaff() {
  const staff = [
    {
      name: "Dr. Emily Parker",
      role: "Lead Dentist",
      email: "emily@democlinic.com",
      phone: "(555) 111-2222",
      status: "Active",
      avatar: "EP",
    },
    {
      name: "Jessica Martinez",
      role: "Dental Hygienist",
      email: "jessica@democlinic.com",
      phone: "(555) 222-3333",
      status: "Active",
      avatar: "JM",
    },
    {
      name: "Robert Chen",
      role: "Receptionist",
      email: "robert@democlinic.com",
      phone: "(555) 333-4444",
      status: "Active",
      avatar: "RC",
    },
    {
      name: "Dr. Michael Brown",
      role: "Associate Dentist",
      email: "michael@democlinic.com",
      phone: "(555) 444-5555",
      status: "Active",
      avatar: "MB",
    },
    {
      name: "Lisa Anderson",
      role: "Dental Assistant",
      email: "lisa@democlinic.com",
      phone: "(555) 555-6666",
      status: "Active",
      avatar: "LA",
    },
    {
      name: "Tom Wilson",
      role: "Office Manager",
      email: "tom@democlinic.com",
      phone: "(555) 666-7777",
      status: "Active",
      avatar: "TW",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-tour="employees-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team and their roles</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member, idx) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.role}</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-green-600 font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {member.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
