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
import { BookOpen } from "lucide-react";

interface TreatmentPlanManagerProps {
  appointmentId: string;
  patientId: string;
  dentistId: string;
}

export function TreatmentPlanManager({ appointmentId, patientId, dentistId }: TreatmentPlanManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    diagnosis: '',
    priority: 'normal',
    estimated_duration_weeks: [4],
    estimated_cost: [150],
    notes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in plan name and description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          title: formData.title,
          description: formData.description,
          diagnosis: formData.diagnosis,
          priority: formData.priority,
          estimated_duration_weeks: formData.estimated_duration_weeks[0] || null,
          estimated_cost: formData.estimated_cost[0] || null,
          notes: formData.notes,
          status: 'draft',
          start_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        diagnosis: '',
        priority: 'normal',
        estimated_duration_weeks: [4],
        estimated_cost: [150],
        notes: ''
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
          <BookOpen className="h-4 w-4 mr-1" />
          Add to Treatment Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Treatment Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Treatment Plan Name *</Label>
            <Input
              id="title"
              placeholder="e.g., Root Canal Treatment"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed treatment description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
              required
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, description: improvedText }))}
              currentText={formData.description}
              placeholder="treatment plan description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              placeholder="Clinical diagnosis..."
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              className="min-h-[60px]"
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, diagnosis: improvedText }))}
              currentText={formData.diagnosis}
              placeholder="clinical diagnosis"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_weeks">Duration: {formData.estimated_duration_weeks[0]} weeks</Label>
              <Slider
                id="estimated_duration_weeks"
                value={formData.estimated_duration_weeks}
                onValueChange={(value) => setFormData(prev => ({ ...prev, estimated_duration_weeks: value }))}
                max={52}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_cost">Estimated Cost: €{formData.estimated_cost[0]}</Label>
            <Slider
              id="estimated_cost"
              value={formData.estimated_cost}
              onValueChange={(value) => setFormData(prev => ({ ...prev, estimated_cost: value }))}
              max={5000}
              min={50}
              step={50}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes and considerations..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[60px]"
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, notes: improvedText }))}
              currentText={formData.notes}
              placeholder="treatment notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Treatment Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}