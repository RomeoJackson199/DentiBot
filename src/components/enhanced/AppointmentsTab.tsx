import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Plus, 
  Edit, 
  Clock,
  MessageSquare,
  Phone,
  Mail
} from "lucide-react";
import { Patient, AppointmentFollowUp } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentsTabProps {
  appointments: any[];
  followUps: AppointmentFollowUp[];
  patient: Patient;
  dentistId: string;
  onRefresh: () => void;
}

export function AppointmentsTab({
  appointments,
  followUps,
  patient,
  dentistId,
  onRefresh
}: AppointmentsTabProps) {
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({
    follow_up_type: 'phone_call' as const,
    scheduled_date: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointment) return;
    
    try {
      const followUpData = {
        appointment_id: selectedAppointment.id,
        ...formData,
        status: 'pending',
        scheduled_date: formData.scheduled_date || null
      };

      const { error } = await supabase
        .from('appointment_follow_ups')
        .insert(followUpData);

      if (error) throw error;
      toast({
        title: "Follow Up Added",
        description: "Follow up has been scheduled successfully",
      });

      setShowFollowUpDialog(false);
      setSelectedAppointment(null);
      setFormData({
        follow_up_type: 'phone_call',
        scheduled_date: '',
        notes: ''
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule follow up",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      toast({
        title: "Status Updated",
        description: "Appointment status has been updated",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'confirmed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getFollowUpIcon = (type: string) => {
    switch (type) {
      case 'phone_call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Appointments</h3>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
              <p className="text-muted-foreground">No appointments found for this patient.</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </h4>
                      <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    {appointment.urgency && (
                      <Badge variant={getUrgencyColor(appointment.urgency)}>
                        {appointment.urgency}
                      </Badge>
                    )}
                    <Select
                      value={appointment.status}
                      onValueChange={(value) => handleStatusChange(appointment.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {appointment.consultation_notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800">
                      <strong>Consultation Notes:</strong> {appointment.consultation_notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(appointment.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog open={showFollowUpDialog && selectedAppointment?.id === appointment.id} onOpenChange={setShowFollowUpDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Schedule Follow Up
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Schedule Follow Up</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="follow_up_type">Follow Up Type</Label>
                            <Select
                              value={formData.follow_up_type}
                              onValueChange={(value) => setFormData({ ...formData, follow_up_type: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="phone_call">Phone Call</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="in_person">In Person</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="scheduled_date">Scheduled Date</Label>
                            <Input
                              id="scheduled_date"
                              type="datetime-local"
                              value={formData.scheduled_date}
                              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setShowFollowUpDialog(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              Schedule Follow Up
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Follow Ups for this appointment */}
                {followUps.filter(fu => fu.appointment_id === appointment.id).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-medium mb-2">Follow Ups</h5>
                    <div className="space-y-2">
                      {followUps
                        .filter(fu => fu.appointment_id === appointment.id)
                        .map((followUp) => (
                          <div key={followUp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              {getFollowUpIcon(followUp.follow_up_type)}
                              <span className="text-sm capitalize">
                                {followUp.follow_up_type.replace('_', ' ')}
                              </span>
                              <Badge variant={followUp.status === 'completed' ? 'default' : 'secondary'}>
                                {followUp.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {followUp.scheduled_date && new Date(followUp.scheduled_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}