import { useState, useMemo } from "react";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Search, Filter, CheckCircle, XCircle, Eye } from "lucide-react";
import { formatClinicTime, utcToClinicTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DentistAppointmentsManagement() {
  const { dentistId, loading: dentistLoading } = useCurrentDentist();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("today_7");
  const { toast } = useToast();

  // Calculate date range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case "today":
        return { 
          fromDate: today, 
          toDate: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        };
      case "today_7":
        return { 
          fromDate: today, 
          toDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) 
        };
      case "week":
        return { 
          fromDate: today, 
          toDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) 
        };
      case "month":
        return { 
          fromDate: today, 
          toDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) 
        };
      default:
        return { 
          fromDate: today, 
          toDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) 
        };
    }
  }, [dateRange]);

  const { 
    appointments, 
    counts, 
    loading, 
    error, 
    refetch, 
    updateAppointment 
  } = useAppointments({
    role: 'dentist',
    dentistId: dentistId || undefined,
    status: statusFilter === "all" ? undefined : [statusFilter],
    fromDate,
    toDate,
    autoRefresh: true
  });

  // Filter appointments by search term
  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments;
    
    const term = searchTerm.toLowerCase();
    return appointments.filter(apt => 
      (apt.patient_name?.toLowerCase().includes(term)) ||
      (apt.patient?.first_name?.toLowerCase().includes(term)) ||
      (apt.patient?.last_name?.toLowerCase().includes(term)) ||
      (apt.reason?.toLowerCase().includes(term)) ||
      (apt.notes?.toLowerCase().includes(term))
    );
  }, [appointments, searchTerm]);

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointment(appointmentId, { 
        status: newStatus as any,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusBadge = (status: string, urgency: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200", 
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200"
    };

    const urgencyColors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-orange-100 text-orange-800 border-orange-200",
      low: "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
      <div className="flex gap-1">
        <Badge className={cn("text-xs", statusColors[status as keyof typeof statusColors])}>
          {status}
        </Badge>
        <Badge className={cn("text-xs", urgencyColors[urgency as keyof typeof urgencyColors])}>
          {urgency}
        </Badge>
      </div>
    );
  };

  if (dentistLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You are not registered as a dentist. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments Management</h1>
          <p className="text-gray-600 mt-1">Manage and view all your patient appointments</p>
        </div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{counts.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, reason, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="today_7">Today + 7 days</SelectItem>
                <SelectItem value="week">Next Week</SelectItem>
                <SelectItem value="month">Next Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={refetch} variant="outline" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found for the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-600">Time</th>
                    <th className="pb-3 font-medium text-gray-600">Patient</th>
                    <th className="pb-3 font-medium text-gray-600">Reason</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => {
                    const clinicTime = utcToClinicTime(new Date(appointment.appointment_date));
                    const patientName = appointment.patient_name || 
                      `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.trim() ||
                      'Unknown Patient';
                    
                    return (
                      <tr key={appointment.id} className="border-b hover:bg-gray-50">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">
                                {formatClinicTime(clinicTime, 'HH:mm')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatClinicTime(clinicTime, 'MMM d')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{patientName}</div>
                              {appointment.patient?.email && (
                                <div className="text-sm text-gray-500">
                                  {appointment.patient.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900">
                              {appointment.reason || 'General consultation'}
                            </div>
                            {appointment.notes && (
                              <div className="text-sm text-gray-500 truncate">
                                {appointment.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          {getStatusBadge(appointment.status, appointment.urgency)}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1"
                              onClick={() => {
                                // TODO: Open appointment details dialog
                                toast({
                                  title: "Appointment Details",
                                  description: `Viewing details for ${patientName}`,
                                });
                              }}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            {appointment.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Confirm
                              </Button>
                            )}
                            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="gap-1"
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              >
                                <XCircle className="h-3 w-3" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}