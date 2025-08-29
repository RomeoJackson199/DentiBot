import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatClinicTime } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { Appointment } from './AppointmentManager';

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  selectedAppointments: string[];
  onSelectAppointment: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onStatusChange: (id: string, status: Appointment['status'], reason?: string) => void;
  onViewDetails: (appointment: Appointment) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading,
  selectedAppointments,
  onSelectAppointment,
  onSelectAll,
  onStatusChange,
  onViewDetails,
}) => {
  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: Appointment['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUrgencyIcon = (urgency: Appointment['urgency']) => {
    switch (urgency) {
      case 'high':
        return <Zap className="w-3 h-3" />;
      case 'medium':
        return <AlertCircle className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatPatientName = (appointment: Appointment) => {
    if (appointment.patient_name) {
      return appointment.patient_name;
    }
    if (appointment.profiles) {
      return `${appointment.profiles.first_name} ${appointment.profiles.last_name}`.trim();
    }
    return 'Unknown Patient';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No appointments found</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            No appointments scheduled yet — book now or adjust your filters to see more results.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allSelected = appointments.length > 0 && selectedAppointments.length === appointments.length;
  const someSelected = selectedAppointments.length > 0 && selectedAppointments.length < appointments.length;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el && 'indeterminate' in el) {
                        (el as any).indeterminate = someSelected;
                      }
                    }}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all appointments"
                  />
                </TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedAppointments.includes(appointment.id) && "bg-muted/30"
                  )}
                  onClick={() => onViewDetails(appointment)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedAppointments.includes(appointment.id)}
                      onCheckedChange={() => onSelectAppointment(appointment.id)}
                      aria-label={`Select appointment for ${formatPatientName(appointment)}`}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{formatPatientName(appointment)}</span>
                      </div>
                      {appointment.profiles?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{appointment.profiles.email}</span>
                        </div>
                      )}
                      {appointment.profiles?.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{appointment.profiles.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatClinicTime(appointment.appointment_date, 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatClinicTime(appointment.appointment_date, 'HH:mm')}
                          {appointment.duration_minutes && ` (${appointment.duration_minutes}min)`}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm font-medium truncate" title={appointment.reason}>
                        {appointment.reason || 'General consultation'}
                      </p>
                      {appointment.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1" title={appointment.notes}>
                          Note: {appointment.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize", getStatusColor(appointment.status))}
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className={cn("flex items-center gap-1 capitalize", getUrgencyColor(appointment.urgency))}>
                      {getUrgencyIcon(appointment.urgency)}
                      <span className="text-sm font-medium">{appointment.urgency}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(appointment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {appointment.status === 'pending' && (
                          <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Confirm
                          </DropdownMenuItem>
                        )}
                        {appointment.status === 'confirmed' && (
                          <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                          <DropdownMenuItem 
                            onClick={() => onStatusChange(appointment.id, 'cancelled', 'Cancelled by dentist')}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};