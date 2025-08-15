import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Video,
  User,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Navigation,
  MessageCircle,
  Star,
  CheckCircle,
  AlertTriangle,
  X,
  Zap
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  dentistName: string;
  dentistImage?: string;
  type: string;
  duration: number;
  location: string;
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  canReschedule: boolean;
  canCancel: boolean;
  videoCall?: boolean;
}

interface EnhancedAppointmentsViewProps {
  appointments: Appointment[];
  onBook: () => void;
  onReschedule: (appointmentId: string) => void;
  onCancel: (appointmentId: string) => void;
  onViewDetails: (appointmentId: string) => void;
}

const SWIPE_THRESHOLD = 100;

export const EnhancedAppointmentsView: React.FC<EnhancedAppointmentsViewProps> = ({
  appointments = [],
  onBook,
  onReschedule,
  onCancel,
  onViewDetails
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [swipedAppointment, setSwipedAppointment] = useState<string | null>(null);

  // Sample data if no appointments provided
  const sampleAppointments: Appointment[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '14:30',
      dentistName: 'Dr. Sarah Johnson',
      type: 'Regular Checkup',
      duration: 60,
      location: 'Main Clinic - Room 102',
      status: 'confirmed',
      priority: 'medium',
      canReschedule: true,
      canCancel: true,
      videoCall: false,
      notes: 'Regular 6-month checkup and cleaning'
    },
    {
      id: '2',
      date: '2024-01-22',
      time: '10:00',
      dentistName: 'Dr. Michael Chen',
      type: 'Teeth Cleaning',
      duration: 45,
      location: 'Downtown Clinic - Room 201',
      status: 'upcoming',
      priority: 'low',
      canReschedule: true,
      canCancel: true,
      videoCall: true,
      notes: 'Deep cleaning session'
    },
    {
      id: '3',
      date: '2024-01-08',
      time: '16:00',
      dentistName: 'Dr. Sarah Johnson',
      type: 'Root Canal - Session 2',
      duration: 90,
      location: 'Main Clinic - Room 102',
      status: 'completed',
      priority: 'high',
      canReschedule: false,
      canCancel: false,
      videoCall: false,
      notes: 'Second session of root canal treatment'
    }
  ];

  const displayAppointments = appointments.length > 0 ? appointments : sampleAppointments;

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-700';
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700';
      case 'rescheduled':
        return 'bg-yellow-500/10 text-yellow-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: Appointment['priority']) => {
    switch (priority) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Zap className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const SwipeableAppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [0.5, 1, 0.5]);
    const scale = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [0.95, 1, 0.95]);

    const handleDragEnd = (event: any, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
        if (offset > 0) {
          // Swiped right - show options
          setSwipedAppointment(appointment.id);
        } else {
          // Swiped left - quick action
          onViewDetails(appointment.id);
        }
      }
      x.set(0);
    };

    const isUpcoming = ['upcoming', 'confirmed'].includes(appointment.status);
    const isPast = appointment.status === 'completed';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        {/* Swipe Actions Background */}
        <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg">
          <div className="flex items-center space-x-2 text-green-600">
            <Edit className="h-5 w-5" />
            <span className="text-sm font-medium">Reschedule</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-600">
            <ChevronRight className="h-5 w-5" />
            <span className="text-sm font-medium">View Details</span>
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x, opacity, scale }}
          className="relative z-10"
        >
          <Card 
            className={cn(
              "mb-3 cursor-pointer transition-all duration-200 hover:shadow-md",
              isPast && "opacity-75"
            )}
            onClick={() => setSelectedAppointment(appointment)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{appointment.type}</h3>
                      {getPriorityIcon(appointment.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {appointment.dentistName}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {appointment.time}
                        </span>
                      </div>
                      {appointment.duration && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">
                            {appointment.duration}min
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                    {appointment.status}
                  </Badge>
                  
                  <div className="flex items-center space-x-1">
                    {appointment.videoCall && (
                      <div className="p-1 bg-blue-500/10 rounded">
                        <Video className="h-3 w-3 text-blue-500" />
                      </div>
                    )}
                    {appointment.location && (
                      <div className="p-1 bg-gray-500/10 rounded">
                        <MapPin className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {isUpcoming && (
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  const AppointmentDetailModal = () => {
    if (!selectedAppointment) return null;

    return (
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedAppointment.type}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedAppointment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Dentist Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedAppointment.dentistName}</h3>
                <p className="text-sm text-muted-foreground">Dental Specialist</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.time} ({selectedAppointment.duration} minutes)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.location}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 pt-4">
              {selectedAppointment.videoCall && (
                <Button className="w-full" size="lg">
                  <Video className="h-4 w-4 mr-2" />
                  Join Video Call
                </Button>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Clinic
                </Button>
              </div>

              {['upcoming', 'confirmed'].includes(selectedAppointment.status) && (
                <div className="flex space-x-2">
                  {selectedAppointment.canReschedule && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        onReschedule(selectedAppointment.id);
                        setSelectedAppointment(null);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                  )}
                  {selectedAppointment.canCancel && (
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => {
                        onCancel(selectedAppointment.id);
                        setSelectedAppointment(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const upcomingAppointments = displayAppointments.filter(apt => 
    ['upcoming', 'confirmed'].includes(apt.status)
  );
  const pastAppointments = displayAppointments.filter(apt => 
    apt.status === 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            {upcomingAppointments.length} upcoming, {pastAppointments.length} completed
          </p>
        </div>
        <Button onClick={onBook}>
          <Plus className="h-4 w-4 mr-2" />
          Book New
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{pastAppointments.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {displayAppointments.filter(apt => apt.videoCall).length}
            </div>
            <div className="text-xs text-muted-foreground">Virtual</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Upcoming Appointments</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {upcomingAppointments.map((appointment) => (
                <SwipeableAppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Past Appointments</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {pastAppointments.slice(0, 3).map((appointment) => (
                <SwipeableAppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                />
              ))}
            </AnimatePresence>
          </div>
          {pastAppointments.length > 3 && (
            <Button variant="outline" className="w-full mt-3">
              View All Past Appointments
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {displayAppointments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first appointment to get started
            </p>
            <Button onClick={onBook}>
              <Plus className="h-4 w-4 mr-2" />
              Book Your First Appointment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Swipe Hint */}
      <div className="text-center text-xs text-muted-foreground">
        💡 Swipe left on appointments for quick actions
      </div>

      <AppointmentDetailModal />
    </div>
  );
};