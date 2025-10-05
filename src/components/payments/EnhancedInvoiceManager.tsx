import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Send, Download, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function EnhancedInvoiceManager({ dentistId }: { dentistId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: invoices } = useQuery({
    queryKey: ['invoices', dentistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          patient:profiles!payment_requests_patient_id_fkey(first_name, last_name, email)
        `)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-for-invoices', dentistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id, patient:profiles!appointments_patient_id_fkey(id, first_name, last_name, email)')
        .eq('dentist_id', dentistId);

      if (error) throw error;

      // Get unique patients
      const uniquePatients = Array.from(
        new Map(data.map(item => [item.patient_id, item.patient])).values()
      );

      return uniquePatients;
    }
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          dentist_id: dentistId,
          patient_id: selectedPatient,
          amount: parseFloat(amount),
          description,
          due_date: dueDate,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: "Invoice created successfully" });
      setIsCreateOpen(false);
      setSelectedPatient("");
      setAmount("");
      setDescription("");
      setDueDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sendReminder = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.functions.invoke('send-payment-reminder', {
        body: { paymentRequestId: invoiceId }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Reminder sent successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reminder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount (€)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Treatment details..."
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <Button
                onClick={() => createInvoice.mutate()}
                disabled={!selectedPatient || !amount || createInvoice.isPending}
                className="w-full"
              >
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {invoices?.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-semibold">
                      {invoice.patient?.first_name} {invoice.patient?.last_name}
                    </h3>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{invoice.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="font-medium">Amount: €{invoice.amount}</span>
                    <span className="text-muted-foreground">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                    {invoice.paid_at && (
                      <span className="text-muted-foreground">
                        Paid: {formatDistanceToNow(new Date(invoice.paid_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {invoice.status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReminder.mutate(invoice.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
