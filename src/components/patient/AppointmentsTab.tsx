import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Filter,
  Search,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Video,
  Building,
  Star,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast, isFuture } from "date-fns";

export interface AppointmentsTabProps {
  user: User;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  treatment_type?: string;
  dentist?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
  notes?: string;
}

const CalendarView = ({ 
  selectedDate, 
  onSelectDate, 
  appointments 
}: { 
  selectedDate: Date; 
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), date)
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="hidden md:inline-flex"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground py-1">
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day[0]}</span>
            </div>
          ))}
          
          {/* Empty days */}
          {emptyDays.map(day => (
            <div key={`empty-${day}`} className="aspect-square" />
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const dayAppointments = getAppointmentsForDay(day);
            const hasAppointments = dayAppointments.length > 0;
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const isPastDay = isPast(day) && !isCurrentDay;
            
            return (
              <motion.button
                key={day.toString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-all",
                  isSelected && "bg-primary text-primary-foreground border-primary",
                  !isSelected && isCurrentDay && "bg-primary/10 border-primary/50",
                  !isSelected && !isCurrentDay && "hover:bg-muted border-border",
                  isPastDay && "opacity-50",
                  hasAppointments && !isSelected && "border-orange-500/50"
                )}
              >
                <span className={cn(
                  "text-xs md:text-sm font-medium",
                  isSelected && "text-primary-foreground",
                  !isSelected && isCurrentDay && "text-primary"
                )}>
                  {format(day, 'd')}
                </span>
                {hasAppointments && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
                    {dayAppointments.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          isSelected ? "bg-primary-foreground" : "bg-orange-500"
                        )}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const AppointmentCard = ({ 
  appointment, 
  onReschedule,
  onCancel 
}: { 
  appointment: Appointment;
  onReschedule: () => void;
  onCancel: () => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const StatusIcon = getStatusIcon(appointment.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all">
        <div className={cn(
          "h-1 w-full",
          appointment.status === 'confirmed' && "bg-green-500",
          appointment.status === 'pending' && "bg-yellow-500",
          appointment.status === 'cancelled' && "bg-red-500",
          appointment.status === 'completed' && "bg-blue-500"
        )} />
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                appointment.status === 'confirmed' && "bg-green-100 dark:bg-green-900/30",
                appointment.status === 'pending' && "bg-yellow-100 dark:bg-yellow-900/30",
                appointment.status === 'cancelled' && "bg-red-100 dark:bg-red-900/30",
                appointment.status === 'completed' && "bg-blue-100 dark:bg-blue-900/30"
              )}>
                <StatusIcon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base">
                  {appointment.treatment_type || 'General Checkup'}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{appointment.appointment_time}</span>
            </div>
            {appointment.dentist && (
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="h-3 w-3 text-muted-foreground" />
                <span>Dr. {appointment.dentist.first_name} {appointment.dentist.last_name}</span>
                {appointment.dentist.specialization && (
                  <Badge variant="outline" className="text-xs">
                    {appointment.dentist.specialization}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span>Main Clinic</span>
            </div>
          </div>

          {appointment.notes && (
            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <p className="text-xs md:text-sm text-muted-foreground">
                {appointment.notes}
              </p>
            </div>
          )}

          {appointment.status === 'confirmed' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onReschedule}
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ user }) => {
  const [tab, setTab] = useState<'calendar' | 'upcoming' | 'past'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, [user.id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
            *,
            dentist:dentist_id(first_name, last_name, specialization)
          `)
          .eq('patient_id', profile.id)
          .order('appointment_date', { ascending: false });

        if (appointmentsData) {
          setAppointments(appointmentsData as any);
          
          // Calculate stats
          const now = new Date();
          const upcoming = appointmentsData.filter(apt => 
            new Date(apt.appointment_date) > now && apt.status === 'confirmed'
          ).length;
          const completed = appointmentsData.filter(apt => apt.status === 'completed').length;
          const cancelled = appointmentsData.filter(apt => apt.status === 'cancelled').length;
          
          setStats({
            total: appointmentsData.length,
            upcoming,
            completed,
            cancelled
          });
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateAppointments = useMemo(() => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), selectedDate)
    );
  }, [appointments, selectedDate]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointment_date) > now && apt.status !== 'cancelled'
    ).sort((a, b) => 
      new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    );
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointment_date) <= now || apt.status === 'completed'
    ).sort((a, b) => 
      new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    );
  }, [appointments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Appointments</h2>
            <p className="text-sm text-muted-foreground">Manage your dental visits</p>
          </div>
          <Button onClick={() => setShowBooking(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Book New
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center space-x-1">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Calendar</span>
              <span className="md:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="calendar" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <CalendarView
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    appointments={appointments}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <AnimatePresence mode="wait">
                          {selectedDateAppointments.length > 0 ? (
                            <div className="space-y-3">
                              {selectedDateAppointments.map(apt => (
                                <AppointmentCard
                                  key={apt.id}
                                  appointment={apt}
                                  onReschedule={() => setShowBooking(true)}
                                  onCancel={() => {}}
                                />
                              ))}
                            </div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-8"
                            >
                              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground">
                                No appointments on this day
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => setShowBooking(true)}
                              >
                                Book Appointment
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              <div className="space-y-3">
                <AnimatePresence>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(apt => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        onReschedule={() => setShowBooking(true)}
                        onCancel={() => {}}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Schedule your next dental visit
                        </p>
                        <Button onClick={() => setShowBooking(true)}>
                          Book Appointment
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              <div className="space-y-3">
                <AnimatePresence>
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map(apt => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        onReschedule={() => {}}
                        onCancel={() => {}}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No past appointments</h3>
                        <p className="text-sm text-muted-foreground">
                          Your appointment history will appear here
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto p-0">
          <AppointmentBooking
            user={user}
            onCancel={() => setShowBooking(false)}
            onComplete={() => {
              setShowBooking(false);
              fetchAppointments();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};