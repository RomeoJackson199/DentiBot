import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { User } from "@supabase/supabase-js";

export interface AppointmentsTabProps {
  user: User;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ user }) => {
  const [tab, setTab] = useState<'upcoming' | 'past' | 'incomplete'>('upcoming');

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Appointments</h2>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="upcoming" className="mt-0">
            <RealAppointmentsList user={user} filter="upcoming" />
          </TabsContent>
          <TabsContent value="past" className="mt-0">
            <RealAppointmentsList user={user} filter="past" />
          </TabsContent>
          <TabsContent value="incomplete" className="mt-0">
            <RealAppointmentsList user={user} filter="incomplete" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};