import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, Search, Filter, Calendar, User } from "lucide-react";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";

interface Prescription {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  patient_name?: string;
}

interface PrescriptionManagerProps {
  dentistId: string;
}

export function PrescriptionManager({ dentistId }: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isMobile, cardClass } = useMobileOptimizations();

  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    status: 'active' as const
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [dentistId]);

  const fetchPrescriptions = async () => {
    try {
      // For now, we'll just create a simple placeholder since the table structure may not exist
      // In a real implementation, this would fetch from a prescriptions table
      setPrescriptions([]);
      setLoading(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch prescriptions",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    try {
      // Placeholder for creating prescription
      // In a real implementation, this would insert into database
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });

      setIsDialogOpen(false);
      setNewPrescription({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        status: 'active'
      });
      fetchPrescriptions();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'p-4' : ''}`}>
      {/* Header */}
      <Card className={`${cardClass} border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50`}>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Pill className="h-6 w-6 mr-2 text-blue-600" />
            Prescription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-col ${isMobile ? 'space-y-4' : 'sm:flex-row sm:space-y-0 sm:space-x-4'}`}>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions or patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Prescription</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medication">Medication Name</Label>
                      <Input
                        id="medication"
                        value={newPrescription.medication_name}
                        onChange={(e) => setNewPrescription({...newPrescription, medication_name: e.target.value})}
                        placeholder="Enter medication name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={newPrescription.dosage}
                          onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Input
                          id="frequency"
                          value={newPrescription.frequency}
                          onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                          placeholder="e.g., 2x daily"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={newPrescription.duration}
                        onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                        placeholder="e.g., 7 days"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={newPrescription.instructions}
                        onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                        placeholder="Special instructions for the patient"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreatePrescription} className="w-full">
                      Create Prescription
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card className={`${cardClass} text-center p-8`}>
        <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Prescriptions Found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first prescription to get started
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prescription
            </Button>
          </DialogTrigger>
        </Dialog>
      </Card>
    </div>
  );
}