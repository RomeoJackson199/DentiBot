import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";
import { Pill, Plus } from "lucide-react";

interface PrescriptionManagerProps {
  appointmentId: string;
  patientId: string;
  dentistId: string;
}

export function PrescriptionManager({ appointmentId, patientId, dentistId }: PrescriptionManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          medication_name: formData.medication_name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          instructions: formData.instructions,
          prescribed_date: new Date().toISOString().split('T')[0],
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription created successfully",
      });

      setOpen(false);
      setFormData({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pill className="h-4 w-4 mr-1" />
          Add Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication_name">Medication Name *</Label>
            <Input
              id="medication_name"
              placeholder="e.g., Amoxicillin"
              value={formData.medication_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              placeholder="e.g., 500mg"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Once daily">Once daily</SelectItem>
                <SelectItem value="Twice daily">Twice daily</SelectItem>
                <SelectItem value="Three times daily">Three times daily</SelectItem>
                <SelectItem value="Four times daily">Four times daily</SelectItem>
                <SelectItem value="As needed">As needed</SelectItem>
                <SelectItem value="Before meals">Before meals</SelectItem>
                <SelectItem value="After meals">After meals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 7 days"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Additional instructions for the patient..."
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              className="min-h-[80px]"
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, instructions: improvedText }))}
              currentText={formData.instructions}
              placeholder="prescription instructions"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Prescription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}