import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export interface AppointmentsTabProps {
  user: User;
  onBookNew?: () => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ user, onBookNew }) => {
  const [tab, setTab] = useState<'upcoming' | 'past' | 'incomplete'>('upcoming');

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Appointments</h2>
        <Button onClick={onBookNew}>Book New</Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="upcoming" className="mt-0">
            <RealAppointmentsList user={user} filter="upcoming" onBookNew={onBookNew} />
          </TabsContent>
          <TabsContent value="past" className="mt-0">
            <RealAppointmentsList user={user} filter="past" onBookNew={onBookNew} />
          </TabsContent>
          <TabsContent value="incomplete" className="mt-0">
            <RealAppointmentsList user={user} filter="incomplete" onBookNew={onBookNew} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};