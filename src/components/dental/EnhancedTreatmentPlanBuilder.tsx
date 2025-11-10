import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToothChart, ToothData } from "./ToothChart";
import { Plus, Trash2, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProcedureWithCost {
  id: string;
  name: string;
  toothNumbers: number[];
  cost: number;
  duration: string;
  notes?: string;
}

interface EnhancedTreatmentPlan {
  title: string;
  description: string;
  diagnosis: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  selectedTeeth: ToothData[];
  procedures: ProcedureWithCost[];
  estimatedTotalCost: number;
  targetCompletionDate: string;
  notes: string;
}

interface EnhancedTreatmentPlanBuilderProps {
  patientId: string;
  dentistId: string;
  onSave?: () => void;
}

const COMMON_PROCEDURES = [
  { name: "Filling (Composite)", cost: 150, duration: "30 min" },
  { name: "Root Canal", cost: 800, duration: "90 min" },
  { name: "Crown", cost: 1200, duration: "60 min" },
  { name: "Extraction", cost: 200, duration: "30 min" },
  { name: "Cleaning", cost: 100, duration: "45 min" },
  { name: "Whitening", cost: 400, duration: "60 min" },
  { name: "Implant", cost: 2500, duration: "120 min" },
  { name: "Veneer", cost: 1000, duration: "60 min" },
  { name: "Bridge", cost: 1500, duration: "90 min" },
  { name: "Denture (Partial)", cost: 1300, duration: "60 min" },
];

export function EnhancedTreatmentPlanBuilder({
  patientId,
  dentistId,
  onSave
}: EnhancedTreatmentPlanBuilderProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EnhancedTreatmentPlan>({
    title: "",
    description: "",
    diagnosis: "",
    priority: "normal",
    selectedTeeth: [],
    procedures: [],
    estimatedTotalCost: 0,
    targetCompletionDate: "",
    notes: "",
  });

  const [showProcedureDialog, setShowProcedureDialog] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<{
    name: string;
    cost: number;
    duration: string;
    notes: string;
  }>({
    name: "",
    cost: 0,
    duration: "",
    notes: "",
  });

  const [tempSelectedTeeth, setTempSelectedTeeth] = useState<number[]>([]);

  const handleToothSelect = (toothNumber: number) => {
    const existingTooth = formData.selectedTeeth.find(
      (t) => t.toothNumber === toothNumber
    );

    if (existingTooth) {
      return; // Already selected, do nothing (or could toggle)
    }

    const newTooth: ToothData = {
      toothNumber,
      procedures: [],
      status: "healthy",
    };

    setFormData({
      ...formData,
      selectedTeeth: [...formData.selectedTeeth, newTooth],
    });
  };

  const handleToothDeselect = (toothNumber: number) => {
    setFormData({
      ...formData,
      selectedTeeth: formData.selectedTeeth.filter(
        (t) => t.toothNumber !== toothNumber
      ),
      procedures: formData.procedures.map((proc) => ({
        ...proc,
        toothNumbers: proc.toothNumbers.filter((t) => t !== toothNumber),
      })),
    });
  };

  const addProcedure = () => {
    if (!currentProcedure.name || tempSelectedTeeth.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select teeth and enter procedure details",
        variant: "destructive",
      });
      return;
    }

    const newProcedure: ProcedureWithCost = {
      id: Date.now().toString(),
      name: currentProcedure.name,
      toothNumbers: tempSelectedTeeth,
      cost: currentProcedure.cost * tempSelectedTeeth.length,
      duration: currentProcedure.duration,
      notes: currentProcedure.notes,
    };

    // Update tooth data with procedure
    const updatedTeeth = formData.selectedTeeth.map((tooth) => {
      if (tempSelectedTeeth.includes(tooth.toothNumber)) {
        return {
          ...tooth,
          procedures: [...tooth.procedures, currentProcedure.name],
          status: 'issue' as const,
        };
      }
      return tooth;
    });

    const totalCost = [...formData.procedures, newProcedure].reduce(
      (sum, proc) => sum + proc.cost,
      0
    );

    setFormData({
      ...formData,
      selectedTeeth: updatedTeeth,
      procedures: [...formData.procedures, newProcedure],
      estimatedTotalCost: totalCost,
    });

    // Reset
    setCurrentProcedure({ name: "", cost: 0, duration: "", notes: "" });
    setTempSelectedTeeth([]);
    setShowProcedureDialog(false);
  };

  const removeProcedure = (procedureId: string) => {
    const procedure = formData.procedures.find((p) => p.id === procedureId);
    if (!procedure) return;

    // Update tooth data
    const updatedTeeth = formData.selectedTeeth.map((tooth) => {
      if (procedure.toothNumbers.includes(tooth.toothNumber)) {
        return {
          ...tooth,
          procedures: tooth.procedures.filter((p) => p !== procedure.name),
          status: tooth.procedures.filter((p) => p !== procedure.name).length > 0
            ? ('issue' as const)
            : ('healthy' as const),
        };
      }
      return tooth;
    });

    const updatedProcedures = formData.procedures.filter(
      (p) => p.id !== procedureId
    );
    const totalCost = updatedProcedures.reduce((sum, proc) => sum + proc.cost, 0);

    setFormData({
      ...formData,
      selectedTeeth: updatedTeeth,
      procedures: updatedProcedures,
      estimatedTotalCost: totalCost,
    });
  };

  const selectCommonProcedure = (procedureName: string) => {
    const procedure = COMMON_PROCEDURES.find((p) => p.name === procedureName);
    if (procedure) {
      setCurrentProcedure({
        name: procedure.name,
        cost: procedure.cost,
        duration: procedure.duration,
        notes: "",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.diagnosis) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and diagnosis",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert procedures to simple string array for database
      const proceduresList = formData.procedures.map(
        (proc) => `${proc.name} (Teeth: ${proc.toothNumbers.join(", ")})`
      );

      const { data, error } = await supabase
        .from("treatment_plans")
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          title: formData.title,
          description: formData.description,
          diagnosis: formData.diagnosis,
          treatment_goals: [
            `Treat ${formData.selectedTeeth.length} teeth`,
            `${formData.procedures.length} procedures planned`,
          ],
          procedures: proceduresList,
          estimated_cost: formData.estimatedTotalCost,
          estimated_duration: `${formData.procedures.length * 30} minutes`,
          priority: formData.priority,
          target_completion_date: formData.targetCompletionDate,
          notes: formData.notes,
          start_date: new Date().toISOString(),
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to patient
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", patientId)
        .single();

      if (patientProfile?.user_id) {
        await supabase.from("notifications").insert({
          user_id: patientProfile.user_id,
          patient_id: patientId,
          dentist_id: dentistId,
          type: "treatment_plan",
          title: "New Treatment Plan Created",
          message: `Your dentist has created a new treatment plan: ${formData.title}. Total estimated cost: $${formData.estimatedTotalCost}`,
          priority: "high",
          action_url: "/dashboard?tab=health",
          action_label: "View Treatment Plan",
        });
      }

      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });

      onSave?.();

      // Reset form
      setFormData({
        title: "",
        description: "",
        diagnosis: "",
        priority: "normal",
        selectedTeeth: [],
        procedures: [],
        estimatedTotalCost: 0,
        targetCompletionDate: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating treatment plan:", error);
      toast({
        title: "Error",
        description: "Failed to create treatment plan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Treatment Plan Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Full Mouth Restoration"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
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
          </div>

          <div>
            <Label htmlFor="diagnosis">Diagnosis *</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              placeholder="Enter patient diagnosis"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="description">Treatment Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the overall treatment plan"
              rows={2}
            />
          </div>

          {/* Tooth Chart */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Select Affected Teeth
            </Label>
            <ToothChart
              selectedTeeth={formData.selectedTeeth}
              onToothSelect={handleToothSelect}
              onToothDeselect={handleToothDeselect}
              interactiveMode={true}
            />
          </div>

          {/* Procedures */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Procedures</Label>
              <Button onClick={() => setShowProcedureDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Procedure
              </Button>
            </div>

            {formData.procedures.length === 0 ? (
              <Card className="bg-gray-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    No procedures added yet. Click "Add Procedure" to begin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {formData.procedures.map((procedure) => (
                  <Card key={procedure.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{procedure.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Teeth: {procedure.toothNumbers.join(", ")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Cost:</span>{" "}
                              <span className="font-semibold">
                                ${procedure.cost}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>{" "}
                              {procedure.duration}
                            </div>
                            <div>
                              <span className="text-gray-600">Teeth Count:</span>{" "}
                              {procedure.toothNumbers.length}
                            </div>
                          </div>
                          {procedure.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {procedure.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProcedure(procedure.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cost Summary */}
          {formData.estimatedTotalCost > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Estimated Cost:</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    ${formData.estimatedTotalCost.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetDate">Target Completion Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetCompletionDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional notes or special considerations"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Treatment Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Procedure Dialog */}
      <Dialog open={showProcedureDialog} onOpenChange={setShowProcedureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Procedure</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Select Common Procedures */}
            <div>
              <Label>Quick Select Common Procedures</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COMMON_PROCEDURES.map((proc) => (
                  <Button
                    key={proc.name}
                    variant="outline"
                    size="sm"
                    onClick={() => selectCommonProcedure(proc.name)}
                    className={
                      currentProcedure.name === proc.name
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }
                  >
                    {proc.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="procedureName">Procedure Name</Label>
              <Input
                id="procedureName"
                value={currentProcedure.name}
                onChange={(e) =>
                  setCurrentProcedure({
                    ...currentProcedure,
                    name: e.target.value,
                  })
                }
                placeholder="Enter procedure name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="procedureCost">Cost per Tooth ($)</Label>
                <Input
                  id="procedureCost"
                  type="number"
                  value={currentProcedure.cost}
                  onChange={(e) =>
                    setCurrentProcedure({
                      ...currentProcedure,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="procedureDuration">Duration</Label>
                <Input
                  id="procedureDuration"
                  value={currentProcedure.duration}
                  onChange={(e) =>
                    setCurrentProcedure({
                      ...currentProcedure,
                      duration: e.target.value,
                    })
                  }
                  placeholder="e.g., 30 min"
                />
              </div>
            </div>

            <div>
              <Label>Select Teeth for this Procedure</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Click on tooth numbers to select:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedTeeth.map((tooth) => (
                    <Button
                      key={tooth.toothNumber}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (tempSelectedTeeth.includes(tooth.toothNumber)) {
                          setTempSelectedTeeth(
                            tempSelectedTeeth.filter(
                              (t) => t !== tooth.toothNumber
                            )
                          );
                        } else {
                          setTempSelectedTeeth([
                            ...tempSelectedTeeth,
                            tooth.toothNumber,
                          ]);
                        }
                      }}
                      className={
                        tempSelectedTeeth.includes(tooth.toothNumber)
                          ? "border-blue-500 bg-blue-100"
                          : ""
                      }
                    >
                      #{tooth.toothNumber}
                    </Button>
                  ))}
                </div>
                {formData.selectedTeeth.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please select teeth on the chart above first
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="procedureNotes">Notes (Optional)</Label>
              <Textarea
                id="procedureNotes"
                value={currentProcedure.notes}
                onChange={(e) =>
                  setCurrentProcedure({
                    ...currentProcedure,
                    notes: e.target.value,
                  })
                }
                placeholder="Any special notes for this procedure"
                rows={2}
              />
            </div>

            {tempSelectedTeeth.length > 0 && currentProcedure.cost > 0 && (
              <Card className="bg-blue-50">
                <CardContent className="p-3">
                  <div className="text-sm">
                    <span className="font-semibold">Total Cost: </span>
                    <span className="text-blue-600 font-bold text-lg">
                      ${(currentProcedure.cost * tempSelectedTeeth.length).toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({tempSelectedTeeth.length} teeth × ${currentProcedure.cost})
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcedureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addProcedure}>Add Procedure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
