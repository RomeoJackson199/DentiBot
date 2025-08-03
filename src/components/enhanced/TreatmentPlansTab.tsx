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
  ClipboardList, 
  Plus, 
  Edit, 
  Calendar,
  DollarSign,
  Clock,
  Target
} from "lucide-react";
import { Patient, TreatmentPlan } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TreatmentPlansTabProps {
  treatmentPlans: TreatmentPlan[];
  patient: Patient;
  dentistId: string;
  onRefresh: () => void;
}

export function TreatmentPlansTab({
  treatmentPlans,
  patient,
  dentistId,
  onRefresh
}: TreatmentPlansTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    diagnosis: '',
    treatment_goals: [''],
    procedures: [''],
    estimated_cost: '',
    estimated_duration: '',
    priority: 'normal' as const,
    target_completion_date: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Submitting treatment plan with data:', { patient, dentistId, formData });
      
      const planData = {
        patient_id: patient.id,
        dentist_id: dentistId,
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        treatment_goals: formData.treatment_goals.filter(goal => goal.trim() !== ''),
        procedures: formData.procedures.filter(proc => proc.trim() !== ''),
        status: 'draft',
        start_date: new Date().toISOString()
      };

      console.log('Final treatment plan data:', planData);

      if (editingPlan) {
        console.log('Updating treatment plan:', editingPlan.id);
        const { data, error } = await supabase
          .from('treatment_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) {
          console.error('Treatment plan update error:', error);
          throw error;
        }
        console.log('Treatment plan updated successfully:', data);
        toast({
          title: "Treatment Plan Updated",
          description: "Treatment plan has been updated successfully",
        });
      } else {
        console.log('Creating new treatment plan');
        const { data, error } = await supabase
          .from('treatment_plans')
          .insert(planData);

        if (error) {
          console.error('Treatment plan insert error:', error);
          throw error;
        }
        console.log('Treatment plan created successfully:', data);
        toast({
          title: "Treatment Plan Added",
          description: "New treatment plan has been added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingPlan(null);
      setFormData({
        plan_name: '',
        description: '',
        diagnosis: '',
        treatment_goals: [''],
        procedures: [''],
        estimated_cost: '',
        estimated_duration: '',
        priority: 'normal' as const,
        target_completion_date: '',
        notes: ''
      });
      onRefresh();
    } catch (error: unknown) {
      console.error('Treatment plan save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: TreatmentPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      description: plan.description || '',
      diagnosis: plan.diagnosis || '',
      treatment_goals: plan.treatment_goals.length > 0 ? plan.treatment_goals : [''],
      procedures: plan.procedures.length > 0 ? plan.procedures : [''],
      estimated_cost: plan.estimated_cost?.toString() || '',
      estimated_duration: plan.estimated_duration || '',
      priority: plan.priority,
      target_completion_date: plan.target_completion_date || '',
      notes: plan.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;
      toast({
        title: "Status Updated",
        description: "Treatment plan status has been updated",
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

  const addGoal = () => {
    setFormData({
      ...formData,
      treatment_goals: [...formData.treatment_goals, '']
    });
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      treatment_goals: formData.treatment_goals.filter((_, i) => i !== index)
    });
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...formData.treatment_goals];
    newGoals[index] = value;
    setFormData({
      ...formData,
      treatment_goals: newGoals
    });
  };

  const addProcedure = () => {
    setFormData({
      ...formData,
      procedures: [...formData.procedures, '']
    });
  };

  const removeProcedure = (index: number) => {
    setFormData({
      ...formData,
      procedures: formData.procedures.filter((_, i) => i !== index)
    });
  };

  const updateProcedure = (index: number, value: string) => {
    const newProcedures = [...formData.procedures];
    newProcedures[index] = value;
    setFormData({
      ...formData,
      procedures: newProcedures
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Treatment Plans</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Treatment Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Treatment Plan' : 'Add New Treatment Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="plan_name">Plan Name</Label>
                <Input
                  id="plan_name"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Treatment Goals</Label>
                {formData.treatment_goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder="Enter treatment goal"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGoal(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addGoal} className="mt-2">
                  Add Goal
                </Button>
              </div>

              <div>
                <Label>Procedures</Label>
                {formData.procedures.map((procedure, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={procedure}
                      onChange={(e) => updateProcedure(index, e.target.value)}
                      placeholder="Enter procedure"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProcedure(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addProcedure} className="mt-2">
                  Add Procedure
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_cost">Estimated Cost (€)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Estimated Duration</Label>
                  <Input
                    id="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="e.g., 6 weeks"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
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
                <div>
                  <Label htmlFor="target_completion_date">Target Completion Date</Label>
                  <Input
                    id="target_completion_date"
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                  />
                </div>
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
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Update' : 'Add'} Treatment Plan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {treatmentPlans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Treatment Plans</h3>
              <p className="text-muted-foreground">No treatment plans have been created for this patient yet.</p>
            </CardContent>
          </Card>
        ) : (
          treatmentPlans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{plan.plan_name}</h4>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      plan.priority === 'urgent' ? 'destructive' :
                      plan.priority === 'high' ? 'default' :
                      plan.priority === 'normal' ? 'secondary' : 'outline'
                    }>
                      {plan.priority}
                    </Badge>
                    <Select
                      value={plan.status}
                      onValueChange={(value) => handleStatusChange(plan.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {plan.diagnosis && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Diagnosis</p>
                    <p className="text-sm text-muted-foreground">{plan.diagnosis}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(plan.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {plan.target_completion_date && (
                    <div>
                      <p className="text-sm font-medium">Target Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(plan.target_completion_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {plan.estimated_cost && (
                    <div>
                      <p className="text-sm font-medium">Estimated Cost</p>
                      <p className="text-sm text-muted-foreground">€{plan.estimated_cost}</p>
                    </div>
                  )}
                  {plan.estimated_duration && (
                    <div>
                      <p className="text-sm font-medium">Estimated Duration</p>
                      <p className="text-sm text-muted-foreground">{plan.estimated_duration}</p>
                    </div>
                  )}
                </div>

                {plan.treatment_goals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Treatment Goals</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {plan.treatment_goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.procedures.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Procedures</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {plan.procedures.map((procedure, index) => (
                        <li key={index}>{procedure}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
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