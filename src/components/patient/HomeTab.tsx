import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationButton } from "@/components/NotificationButton";
import {
  Calendar,
  Navigation2,
  RefreshCw,
  Pill,
  ClipboardList,
  CreditCard,
  MessageSquare,
  User as UserIcon,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HomeTabProps {
  userId: string;
  firstName?: string | null;
  profileImageUrl?: string | null;
  nextAppointment?: {
    id: string;
    date: string;
    time?: string | null;
    dentistName?: string | null;
    status?: string;
  } | null;
  activePrescriptions: number;
  activeTreatmentPlans: number;
  totalDueCents: number;
  onNavigateTo: (section: 'appointments' | 'care' | 'payments') => void;
  onOpenAssistant?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userId,
  firstName,
  profileImageUrl,
  nextAppointment,
  activePrescriptions,
  activeTreatmentPlans,
  totalDueCents,
  onNavigateTo,
  onOpenAssistant,
}) => {
  const unpaid = totalDueCents > 0;

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Welcome</p>
              <p className="text-sm font-semibold">{firstName ? `Hi, ${firstName}` : 'Hi there'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationButton userId={userId} />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-4">
        {/* Quick Actions: mobile 2x2, desktop horizontal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:shadow-sm transition" onClick={() => onNavigateTo('appointments')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Book Appointment</p>
                  <p className="text-xs text-muted-foreground">Schedule a visit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-sm transition" onClick={() => onNavigateTo('care')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Pill className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Prescriptions</p>
                  <p className="text-xs text-muted-foreground">Active meds</p>
                </div>
              </div>
              {activePrescriptions > 0 && (
                <Badge className="ml-2">{activePrescriptions}</Badge>
              )}
            </CardContent>
          </Card>

          {unpaid && (
            <Card className="cursor-pointer hover:shadow-sm transition" onClick={() => onNavigateTo('payments')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pay Balance</p>
                    <p className="text-xs text-muted-foreground">{`€${(totalDueCents/100).toFixed(2)}`}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-sm transition" onClick={onOpenAssistant}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Chat now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {/* 1. Next Appointment Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Next Appointment</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between flex-wrap gap-3">
              {nextAppointment ? (
                <>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{nextAppointment.date}{nextAppointment.time ? ` at ${nextAppointment.time}` : ''}</p>
                      <p className="text-xs text-muted-foreground">{nextAppointment.dentistName || 'Your dentist'}</p>
                    </div>
                    {nextAppointment.status && (
                      <Badge variant="outline" className="ml-2 capitalize">{nextAppointment.status}</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onNavigateTo('appointments')}>Reschedule</Button>
                    <Button variant="ghost" size="sm">
                      <Navigation2 className="h-4 w-4 mr-1" />
                      Directions
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-muted-foreground">No upcoming appointment</p>
                  <Button size="sm" onClick={() => onNavigateTo('appointments')}>Book Now</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Treatment Overview */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="hover:shadow-sm transition cursor-pointer" onClick={() => onNavigateTo('care')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Pill className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Prescriptions</p>
                    <p className="text-xs text-muted-foreground">{activePrescriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-sm transition cursor-pointer" onClick={() => onNavigateTo('care')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <ClipboardList className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Treatment Plans</p>
                    <p className="text-xs text-muted-foreground">{activeTreatmentPlans} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Payments Snapshot */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {unpaid ? (
                <>
                  <p className="text-sm">You owe <span className="font-semibold">€{(totalDueCents/100).toFixed(2)}</span></p>
                  <Button size="sm" onClick={() => onNavigateTo('payments')}>Pay Now</Button>
                </>
              ) : (
                <p className="text-sm text-green-600">All paid up</p>
              )}
            </CardContent>
          </Card>

          {/* 4. Alerts/Reminders */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Bell className="h-4 w-4 mr-2 text-yellow-600" />
                Alerts & Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {nextAppointment ? (
                  <li className="flex items-start">
                    <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                    Remember to arrive 10 minutes early for your next appointment.
                  </li>
                ) : (
                  <li className="flex items-start">
                    <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                    No time-sensitive reminders right now.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};