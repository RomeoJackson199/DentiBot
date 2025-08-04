import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";
import { Pill, Plus, Calendar, Clock, Droplets } from "lucide-react";

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
    dosage_strength: [500],
    frequency: '',
    duration_days: [7],
    instructions: ''
  });
  const { toast } = useToast();

  // Quick frequency buttons
  const quickFrequencies = [
    { label: "Once daily", value: "once daily" },
    { label: "Twice daily", value: "twice daily" },
    { label: "Three times", value: "three times daily" },
    { label: "Four times", value: "four times daily" },
    { label: "As needed", value: "as needed" },
    { label: "Every 6h", value: "every 6 hours" },
    { label: "Every 8h", value: "every 8 hours" },
    { label: "Every 12h", value: "every 12 hours" }
  ];

  // Quick duration buttons
  const quickDurations = [
    { label: "3 days", value: 3 },
    { label: "5 days", value: 5 },
    { label: "7 days", value: 7 },
    { label: "10 days", value: 10 },
    { label: "14 days", value: 14 },
    { label: "21 days", value: 21 },
    { label: "30 days", value: 30 }
  ];

  // Common dosage strengths
  const dosageStrengths = [
    { label: "250mg", value: 250 },
    { label: "500mg", value: 500 },
    { label: "750mg", value: 750 },
    { label: "1000mg", value: 1000 }
  ];

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
          duration_days: formData.duration_days[0],
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
        dosage_strength: [500],
        frequency: '',
        duration_days: [7],
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Input
                  id="dosage"
                  placeholder="e.g., 500mg"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  required
                />
                <div className="space-y-2">
                  <Label className="text-sm">Quick Dosage</Label>
                  <div className="flex flex-wrap gap-2">
                    {dosageStrengths.map((strength) => (
                      <Button
                        key={strength.value}
                        type="button"
                        variant={formData.dosage_strength[0] === strength.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            dosage_strength: [strength.value],
                            dosage: `${strength.value}mg`
                          }))
                        }}
                        className="text-xs"
                      >
                        <Droplets className="h-3 w-3 mr-1" />
                        {strength.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {quickFrequencies.map((freq) => (
                    <Button
                      key={freq.value}
                      type="button"
                      variant={formData.frequency === freq.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {freq.label}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Custom Frequency</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once daily">Once daily</SelectItem>
                      <SelectItem value="twice daily">Twice daily</SelectItem>
                      <SelectItem value="three times daily">Three times daily</SelectItem>
                      <SelectItem value="four times daily">Four times daily</SelectItem>
                      <SelectItem value="as needed">As needed</SelectItem>
                      <SelectItem value="before meals">Before meals</SelectItem>
                      <SelectItem value="after meals">After meals</SelectItem>
                      <SelectItem value="every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="every 12 hours">Every 12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duration: {formData.duration_days[0]} days</Label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {quickDurations.map((duration) => (
                    <Button
                      key={duration.value}
                      type="button"
                      variant={formData.duration_days[0] === duration.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, duration_days: [duration.value] }))}
                      className="gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      {duration.label}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Slider
                    value={formData.duration_days}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration_days: value }))}
                    max={90}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 day</span>
                    <span>90 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Special instructions, side effects to watch for..."
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