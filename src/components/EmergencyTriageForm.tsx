import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AlertTriangle, Activity, Clock, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

interface EmergencyTriageFormProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency') => void;
  onCancel: () => void;
}

export const EmergencyTriageForm = ({ onComplete, onCancel }: EmergencyTriageFormProps) => {
  const { t } = useLanguage();
  const [painLevel, setPainLevel] = useState([5]);
  const [hasBleeding, setHasBleeding] = useState(false);
  const [hasSwelling, setHasSwelling] = useState(false);
  const [hasFever, setHasFever] = useState(false);
  const [hasDifficultySpeaking, setHasDifficultySpeaking] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [previousTreatment, setPreviousTreatment] = useState("");
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);

  const calculateUrgency = () => {
    let score = 0;
    
    // Pain level scoring (0-4 points)
    if (painLevel[0] >= 9) score += 4;
    else if (painLevel[0] >= 7) score += 3;
    else if (painLevel[0] >= 5) score += 2;
    else if (painLevel[0] >= 3) score += 1;
    
    // Critical symptoms (2 points each)
    if (hasBleeding) score += 2;
    if (hasSwelling) score += 2;
    if (hasFever) score += 3; // Fever is more serious
    if (hasDifficultySpeaking) score += 3; // Difficulty speaking indicates severe issue
    
    // Medical conditions increase urgency
    if (medicalConditions.includes('diabetes') || medicalConditions.includes('heart_condition')) {
      score += 2;
    }
    if (medicalConditions.includes('blood_thinner')) {
      score += 1;
    }
    
    // Duration (urgent if recent and severe)
    if ((duration.includes("today") || duration.includes("tonight") || duration.includes("hour")) && painLevel[0] >= 7) {
      score += 2;
    }
    
    // Determine urgency level based on enhanced scoring
    if (score >= 10 || hasFever || hasDifficultySpeaking) return 'emergency';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const handleSubmit = () => {
    const urgency = calculateUrgency();
    onComplete(urgency);
  };

  const getUrgencyColor = (level: number) => {
    if (level <= 3) return "text-green-600 bg-green-50";
    if (level <= 6) return "text-yellow-600 bg-yellow-50";
    if (level <= 8) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getUrgencyText = () => {
    const urgency = calculateUrgency();
    switch(urgency) {
      case 'emergency': return { text: 'EMERGENCY - Immediate Care Needed', color: 'bg-red-100 text-red-800', icon: Heart };
      case 'high': return { text: 'HIGH - Same Day Appointment', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
      case 'medium': return { text: 'MEDIUM - 24-48 Hour Window', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'low': return { text: 'LOW - Standard Appointment', color: 'bg-green-100 text-green-800', icon: Activity };
    }
  };

  const urgencyInfo = getUrgencyText();
  const IconComponent = urgencyInfo.icon;

  const handleMedicalConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setMedicalConditions(prev => [...prev, condition]);
    } else {
      setMedicalConditions(prev => prev.filter(c => c !== condition));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="glass-card border-destructive/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text">Emergency Dental Triage</CardTitle>
          <p className="text-dental-muted-foreground">
            Please complete this assessment to help us prioritize your care
          </p>
        </CardHeader>
      </Card>

      {/* Current Urgency Level */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <IconComponent className="h-6 w-6" />
            <Badge className={`text-lg py-2 px-4 ${urgencyInfo.color}`}>
              {urgencyInfo.text}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pain Assessment */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-dental-primary" />
              Pain Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">
                Pain level (1-10 scale)
              </Label>
              <div className="mt-3">
                <Slider
                  value={painLevel}
                  onValueChange={setPainLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>No pain (1)</span>
                  <span className={`font-medium px-2 py-1 rounded ${getUrgencyColor(painLevel[0])}`}>
                    {painLevel[0]}/10
                  </span>
                  <span>Unbearable (10)</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">How long have you had these symptoms?</Label>
              <Textarea
                id="duration"
                placeholder="e.g., Since this morning, for 3 days, started 2 hours ago..."
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="bleeding" 
                  checked={hasBleeding}
                  onCheckedChange={(checked) => setHasBleeding(checked === true)}
                />
                <Label htmlFor="bleeding">Bleeding from gums or tooth</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="swelling" 
                  checked={hasSwelling}
                  onCheckedChange={(checked) => setHasSwelling(checked === true)}
                />
                <Label htmlFor="swelling">Facial or gum swelling</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="fever" 
                  checked={hasFever}
                  onCheckedChange={(checked) => setHasFever(checked === true)}
                />
                <Label htmlFor="fever" className="text-red-600 font-medium">Fever or feeling unwell</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="speaking" 
                  checked={hasDifficultySpeaking}
                  onCheckedChange={(checked) => setHasDifficultySpeaking(checked === true)}
                />
                <Label htmlFor="speaking" className="text-red-600 font-medium">Difficulty speaking or swallowing</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="symptoms">Describe your symptoms in detail:</Label>
              <Textarea
                id="symptoms"
                placeholder="e.g., Throbbing pain, sensitivity to hot/cold, swollen jaw..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="text-base font-medium">Do you have any of these conditions?</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="diabetes" 
                  checked={medicalConditions.includes('diabetes')}
                  onCheckedChange={(checked) => handleMedicalConditionChange('diabetes', checked === true)}
                />
                <Label htmlFor="diabetes">Diabetes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="heart_condition" 
                  checked={medicalConditions.includes('heart_condition')}
                  onCheckedChange={(checked) => handleMedicalConditionChange('heart_condition', checked === true)}
                />
                <Label htmlFor="heart_condition">Heart condition</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="blood_thinner" 
                  checked={medicalConditions.includes('blood_thinner')}
                  onCheckedChange={(checked) => handleMedicalConditionChange('blood_thinner', checked === true)}
                />
                <Label htmlFor="blood_thinner">Taking blood thinners</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allergies" 
                  checked={medicalConditions.includes('allergies')}
                  onCheckedChange={(checked) => handleMedicalConditionChange('allergies', checked === true)}
                />
                <Label htmlFor="allergies">Drug allergies</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Treatment */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-dental-secondary" />
              Recent Treatment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="treatment">Any recent dental work or medications?</Label>
              <Textarea
                id="treatment"
                placeholder="e.g., Had a filling last week, taking antibiotics, recent tooth extraction..."
                value={previousTreatment}
                onChange={(e) => setPreviousTreatment(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button onClick={handleSubmit} className="flex-1 bg-gradient-primary text-white shadow-elegant">
              <Activity className="h-4 w-4 mr-2" />
              Complete Assessment & Book Emergency Slot
            </Button>
            <Button variant="outline" onClick={onCancel} className="sm:w-auto">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};