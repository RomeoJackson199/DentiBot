import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, Mail, Phone, Video, Send, Plus,
  Clock, CheckCircle, X, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommunicationHubProps {
  dentistId: string;
}

interface Communication {
  id: string;
  patient_id: string;
  communication_type: string;
  subject: string;
  message: string;
  status: string;
  sent_at: string;
  created_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
}

const defaultTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Appointment Reminder',
    subject: 'Upcoming Dental Appointment Reminder',
    content: 'Hello {patient_name}, this is a friendly reminder of your upcoming dental appointment on {appointment_date} at {appointment_time}. Please arrive 15 minutes early. If you need to reschedule, please call us at least 24 hours in advance.',
    type: 'reminder'
  },
  {
    id: '2',
    name: 'Pre-Op Instructions',
    subject: 'Pre-Treatment Instructions',
    content: 'Dear {patient_name}, please follow these instructions before your appointment: 1) Take prescribed medications as directed 2) Avoid eating 2 hours before treatment 3) Bring your insurance card 4) Arrive 15 minutes early.',
    type: 'instruction'
  },
  {
    id: '3',
    name: 'Post-Op Care',
    subject: 'Post-Treatment Care Instructions',
    content: 'Thank you for visiting our office today. Please follow these post-treatment instructions: 1) Avoid hot liquids for 2 hours 2) Take pain medication as prescribed 3) Call if you experience severe pain or swelling 4) Schedule your follow-up appointment.',
    type: 'instruction'
  },
  {
    id: '4',
    name: 'Payment Reminder',
    subject: 'Payment Due Reminder',
    content: 'Hello {patient_name}, we wanted to remind you that you have an outstanding balance of ${amount} for your recent treatment. Please call our office to arrange payment or set up a payment plan.',
    type: 'billing'
  }
];

export const CommunicationHub = ({ dentistId }: CommunicationHubProps) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({
    patient_id: '',
    communication_type: 'email',
    subject: '',
    message: '',
    template_id: ''
  });
  const [patients, setPatients] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
    fetchPatients();
  }, [dentistId]);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCommunications(data || []);
    } catch (error: any) {
      console.error('Error fetching communications:', error);
      toast({
        title: "Error",
        description: "Failed to load communications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id, patient_name')
        .eq('dentist_id', dentistId)
        .not('patient_id', 'is', null);

      if (error) throw error;
      
      // Remove duplicates
      const uniquePatients = data?.reduce((acc: any[], current) => {
        const exists = acc.find(p => p.patient_id === current.patient_id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []) || [];
      
      setPatients(uniquePatients);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.patient_id || !newMessage.message.trim()) {
      toast({
        title: "Error",
        description: "Please select a patient and enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('communications')
        .insert({
          dentist_id: dentistId,
          patient_id: newMessage.patient_id,
          communication_type: newMessage.communication_type,
          subject: newMessage.subject,
          message: newMessage.message,
          status: 'sent'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${newMessage.communication_type.toUpperCase()} sent successfully`,
      });

      setNewMessage({
        patient_id: '',
        communication_type: 'email',
        subject: '',
        message: '',
        template_id: ''
      });
      setShowNewMessage(false);
      fetchCommunications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = defaultTemplates.find(t => t.id === templateId);
    if (template) {
      setNewMessage({
        ...newMessage,
        subject: template.subject,
        message: template.content,
        template_id: templateId
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const emailCommunications = communications.filter(c => c.communication_type === 'email');
  const smsCommunications = communications.filter(c => c.communication_type === 'sms');
  const callLogs = communications.filter(c => c.communication_type === 'call');

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Communication Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-dental-primary" />
          Communication Hub
        </CardTitle>
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newMessage.patient_id}
                  onValueChange={(value) => setNewMessage({ ...newMessage, patient_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.patient_id} value={patient.patient_id}>
                        {patient.patient_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newMessage.communication_type}
                  onValueChange={(value) => setNewMessage({ ...newMessage, communication_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={newMessage.template_id}
                onValueChange={applyTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {defaultTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
              
              <Textarea
                placeholder="Message content"
                rows={6}
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              />

              <div className="flex gap-2">
                <Button onClick={sendMessage} className="bg-gradient-primary">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {communications.length === 0 ? (
              <p className="text-center text-dental-muted-foreground py-8">
                No communications yet
              </p>
            ) : (
              communications.map((comm) => (
                <div
                  key={comm.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(comm.communication_type)}
                    <div>
                      <h4 className="font-semibold">{comm.subject || 'No Subject'}</h4>
                      <p className="text-sm text-dental-muted-foreground">
                        {comm.message.slice(0, 100)}...
                      </p>
                      <p className="text-xs text-dental-muted-foreground">
                        {new Date(comm.sent_at || comm.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {comm.communication_type}
                    </Badge>
                    {getStatusIcon(comm.status)}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            {emailCommunications.map((comm) => (
              <div
                key={comm.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50"
              >
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">{comm.subject}</h4>
                    <p className="text-sm text-dental-muted-foreground">
                      {comm.message.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-dental-muted-foreground">
                      {new Date(comm.sent_at || comm.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusIcon(comm.status)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            {smsCommunications.map((comm) => (
              <div
                key={comm.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50"
              >
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm">{comm.message}</p>
                    <p className="text-xs text-dental-muted-foreground">
                      {new Date(comm.sent_at || comm.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusIcon(comm.status)}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            {callLogs.map((comm) => (
              <div
                key={comm.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50"
              >
                <div className="flex items-center space-x-4">
                  <Phone className="h-5 w-5 text-purple-500" />
                  <div>
                    <h4 className="font-semibold">{comm.subject || 'Phone Call'}</h4>
                    <p className="text-sm text-dental-muted-foreground">{comm.message}</p>
                    <p className="text-xs text-dental-muted-foreground">
                      {new Date(comm.sent_at || comm.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusIcon(comm.status)}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};