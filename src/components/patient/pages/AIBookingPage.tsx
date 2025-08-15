import React from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DentalChatbot } from "@/components/DentalChatbot";
import { Calendar } from "lucide-react";

interface AIBookingPageProps {
  user: User;
  onTabChange?: (tabId: string) => void;
}

export const AIBookingPage: React.FC<AIBookingPageProps> = ({ user, onTabChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Booking</h1>
          <p className="text-muted-foreground">Chat with our assistant to book the right appointment</p>
        </div>
        {onTabChange && (
          <Button variant="outline" onClick={() => onTabChange('appointments')} className="gap-2">
            <Calendar className="h-4 w-4" />
            Go to Appointments
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <DentalChatbot user={user} triggerBooking onBookingTriggered={() => { /* no-op */ }} />
        </CardContent>
      </Card>
    </div>
  );
};