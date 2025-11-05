import { useState } from "react";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { CapacityDashboard } from "@/components/CapacityDashboard";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3 } from "lucide-react";

export default function DentistAdminSchedule() {
  const { dentistId } = useCurrentDentist();
  const [activeTab, setActiveTab] = useState("availability");

  if (!dentistId) return null;

  return (
    <div className="p-3 md:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Availability Settings
          </TabsTrigger>
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Capacity Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability">
          <EnhancedAvailabilitySettings dentistId={dentistId} />
        </TabsContent>

        <TabsContent value="capacity">
          <CapacityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

