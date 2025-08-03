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
  Pill, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock
} from "lucide-react";
import { Patient, Prescription } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
  patient: Patient;
  dentistId: string;
  onRefresh: () => void;
}

export function PrescriptionsTab({
  prescriptions,
  patient,
  dentistId,
  onRefresh
}: PrescriptionsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    expiry_date: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const prescriptionData = {
        patient_id: patient.id,
        dentist_id: dentistId,
        ...formData,
        status: 'active',
        prescribed_date: new Date().toISOString()
      };

      if (editingPrescription) {
        const { error } = await supabase
          .from('prescriptions')
          .update(prescriptionData)
          .eq('id', editingPrescription.id);

        if (error) throw error;
        toast({
          title: "Prescription Updated",
          description: "Prescription has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('prescriptions')
          .insert(prescriptionData);

        if (error) throw error;
        toast({
          title: "Prescription Added",
          description: "New prescription has been added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingPrescription(null);
      setFormData({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        expiry_date: ''
      });
      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setFormData({
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions || '',
      expiry_date: prescription.expiry_date || ''
    });
    setShowAddDialog(true);
  };

  const handleStatusChange = async (prescriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus })
        .eq('id', prescriptionId);

      if (error) throw error;
      toast({
        title: "Status Updated",
        description: "Prescription status has been updated",
      });
      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prescriptions</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPrescription ? 'Edit Prescription' : 'Add New Prescription'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="medication_name">Medication Name</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPrescription ? 'Update' : 'Add'} Prescription
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Prescriptions</h3>
              <p className="text-muted-foreground">No prescriptions have been added for this patient yet.</p>
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Pill className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{prescription.medication_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {prescription.dosage} - {prescription.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      prescription.status === 'active' ? 'default' : 
                      prescription.status === 'completed' ? 'secondary' : 'destructive'
                    }>
                      {prescription.status}
                    </Badge>
                    <Select
                      value={prescription.status}
                      onValueChange={(value) => handleStatusChange(prescription.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{prescription.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Prescribed Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prescription.prescribed_date).toLocaleDateString()}
                    </p>
                  </div>
                  {prescription.expiry_date && (
                    <div>
                      <p className="text-sm font-medium">Expiry Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(prescription.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {prescription.instructions && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">Instructions</p>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(prescription)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}