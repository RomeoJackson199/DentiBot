import { useState } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RestaurantTableManager } from '@/components/restaurant/RestaurantTableManager';
import { RestaurantMenuManager } from '@/components/restaurant/RestaurantMenuManager';
import { RestaurantStaffManager } from '@/components/restaurant/RestaurantStaffManager';
import { RestaurantReservations } from '@/components/restaurant/RestaurantReservations';
import { UtensilsCrossed, Users, CalendarDays, Settings } from 'lucide-react';

export default function RestaurantOwnerDashboard() {
  const { businessId, businessName } = useBusinessContext();
  const { t } = useBusinessTemplate();
  const [activeTab, setActiveTab] = useState('tables');

  if (!businessId) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{businessName} - Management</h1>
        <p className="text-muted-foreground">Manage your restaurant operations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Reservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="mt-6">
          <RestaurantTableManager businessId={businessId} />
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          <RestaurantMenuManager businessId={businessId} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <RestaurantStaffManager businessId={businessId} />
        </TabsContent>

        <TabsContent value="reservations" className="mt-6">
          <RestaurantReservations businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
