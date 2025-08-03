import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Pill, 
  Plus, 
  Save,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";
import { AIConversationDialog } from "@/components/AIConversationDialog";

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: string;
  priority: string;
  estimated_duration_weeks?: number;
  estimated_cost?: number;
  start_date?: string;
  end_date?: string;
  treatment_steps?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PatientTreatmentPlansProps {
  patientId: string;
  dentistId: string;
}

export function PatientTreatmentPlans({ patientId, dentistId }: PatientTreatmentPlansProps) {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    diagnosis: "",
    status: "draft",
    priority: "normal",
    estimated_duration_weeks: 0,
    estimated_cost: 0,
    start_date: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTreatmentPlans();
  }, [patientId, dentistId]);

  const fetchTreatmentPlans = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreatmentPlans(data || []);
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

  const handleAddTreatmentPlan = async () => {
    if (!newPlan.title.trim()) {
      toast({
        title: "Error",
        description: "Treatment plan title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          title: newPlan.title.trim(),
          description: newPlan.description.trim() || null,
          diagnosis: newPlan.diagnosis.trim() || null,
          status: newPlan.status,
          priority: newPlan.priority,
          estimated_duration_weeks: newPlan.estimated_duration_weeks || null,
          estimated_cost: newPlan.estimated_cost || null,
          start_date: newPlan.start_date || null,
          notes: newPlan.notes.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setTreatmentPlans(prev => [data, ...prev]);
      setNewPlan({
        title: "",
        description: "",
        diagnosis: "",
        status: "draft",
        priority: "normal",
        estimated_duration_weeks: 0,
        estimated_cost: 0,
        start_date: "",
        notes: ""
      });
      setIsAddingPlan(false);

      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlanStatus = async (planId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .update({ status: newStatus })
        .eq('id', planId);

      if (error) throw error;

      setTreatmentPlans(prev => 
        prev.map(plan => 
          plan.id === planId 
            ? { ...plan, status: newStatus }
            : plan
        )
      );

      toast({
        title: "Success",
        description: "Treatment plan status updated",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading treatment plans...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Pill className="h-6 w-6 text-dental-primary" />
              <span>Treatment Plans</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setIsAddingPlan(true)} disabled={isAddingPlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create Treatment Plan
              </Button>
              <AIConversationDialog
                patientId={patientId}
                dentistId={dentistId}
                patientName="Patient"
                contextType="treatment"
                onUpdate={fetchTreatmentPlans}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add New Treatment Plan */}
      {isAddingPlan && (
        <Card className="glass-card border-dental-primary">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Create New Treatment Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input
                  value={newPlan.title}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Treatment plan title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Diagnosis</label>
                <Input
                  value={newPlan.diagnosis}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Primary diagnosis"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed treatment description"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={newPlan.priority} onValueChange={(value) => setNewPlan(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Duration (weeks)</label>
                <Input
                  type="number"
                  value={newPlan.estimated_duration_weeks}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, estimated_duration_weeks: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estimated Cost</label>
                <Input
                  type="number"
                  value={newPlan.estimated_cost}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={newPlan.start_date}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Additional Notes</label>
              <Textarea
                value={newPlan.notes}
                onChange={(e) => setNewPlan(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes, special instructions, patient preferences..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddTreatmentPlan} disabled={!newPlan.title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingPlan(false);
                  setNewPlan({
                    title: "",
                    description: "",
                    diagnosis: "",
                    status: "draft",
                    priority: "normal",
                    estimated_duration_weeks: 0,
                    estimated_cost: 0,
                    start_date: "",
                    notes: ""
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plans List */}
      {treatmentPlans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No treatment plans created yet.</p>
            <p className="text-sm">Click "Create Treatment Plan" to start planning treatment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {treatmentPlans.map((plan) => (
            <Card key={plan.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{plan.title}</h3>
                    {plan.diagnosis && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Diagnosis:</strong> {plan.diagnosis}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(plan.priority)}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {plan.priority} priority
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={plan.status} 
                      onValueChange={(value) => handleUpdatePlanStatus(plan.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {plan.description && (
                  <div className="mb-4">
                    <p className="text-sm bg-muted p-3 rounded-md">{plan.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  {plan.estimated_duration_weeks && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.estimated_duration_weeks} weeks</span>
                    </div>
                  )}
                  
                  {plan.estimated_cost && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${plan.estimated_cost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {plan.start_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Start: {format(new Date(plan.start_date), 'PPP')}</span>
                    </div>
                  )}
                </div>

                {plan.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4 text-xs text-muted-foreground">
                  Created: {format(new Date(plan.created_at), 'PPP p')}
                  {plan.updated_at !== plan.created_at && (
                    <span> • Updated: {format(new Date(plan.updated_at), 'PPP p')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}