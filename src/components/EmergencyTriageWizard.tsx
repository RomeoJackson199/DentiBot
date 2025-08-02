import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity, Clock, Heart, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";

interface TriageData {
  painLevel: number;
  symptoms: string[];
  duration: string;
  medicalHistory: string[];
}

interface EmergencyTriageWizardProps {
  onComplete: (urgency: 1 | 2 | 3 | 4 | 5, data: TriageData) => void;
  onCancel: () => void;
}

export const EmergencyTriageWizard = ({ onComplete, onCancel }: EmergencyTriageWizardProps) => {
  const { t } = useLanguageDetection();
  const [currentStep, setCurrentStep] = useState(1);
  const [painLevel, setPainLevel] = useState([5]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const calculateUrgency = (): 1 | 2 | 3 | 4 | 5 => {
    let score = 0;
    
    // Pain level scoring (0-4 points)
    if (painLevel[0] >= 9) score += 4;
    else if (painLevel[0] >= 7) score += 3;
    else if (painLevel[0] >= 5) score += 2;
    else if (painLevel[0] >= 3) score += 1;
    
    // Critical symptoms (emergency indicators)
    const criticalSymptoms = ['difficulty', 'trauma'];
    const hasCritical = symptoms.some(s => criticalSymptoms.includes(s));
    if (hasCritical) score += 5; // Immediate emergency
    
    // High-risk symptoms
    const highRiskSymptoms = ['bleeding', 'swelling', 'fever'];
    const highRiskCount = symptoms.filter(s => highRiskSymptoms.includes(s)).length;
    score += highRiskCount * 1.5;
    
    // Duration impact
    if (duration === 'hours') score += 2; // Recent onset is more urgent
    else if (duration === 'day') score += 1.5;
    else if (duration === 'days') score += 1;
    
    // Medical history risk factors
    const riskFactors = ['diabetes', 'heart', 'blood', 'immune'];
    const riskCount = medicalHistory.filter(h => riskFactors.includes(h)).length;
    score += riskCount * 1;
    
    // Determine urgency level (1-5, where 5 is most urgent)
    if (score >= 8) return 5; // Emergency
    if (score >= 6) return 4; // High urgency
    if (score >= 4) return 3; // Medium urgency
    if (score >= 2) return 2; // Low-medium urgency
    return 1; // Low urgency
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    if (checked) {
      setSymptoms([...symptoms, symptom]);
    } else {
      setSymptoms(symptoms.filter(s => s !== symptom));
    }
  };

  const handleMedicalHistoryChange = (condition: string, checked: boolean) => {
    if (checked) {
      setMedicalHistory([...medicalHistory, condition]);
    } else {
      setMedicalHistory(medicalHistory.filter(h => h !== condition));
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      const urgency = calculateUrgency();
      const triageData: TriageData = {
        painLevel: painLevel[0],
        symptoms,
        duration,
        medicalHistory
      };
      onComplete(urgency, triageData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Pain level always has a value
      case 2: return true; // Symptoms are optional
      case 3: return duration !== ""; // Duration is required
      case 4: return true; // Medical history is optional
      default: return false;
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level <= 3) return "text-green-600";
    if (level <= 6) return "text-yellow-600";
    if (level <= 8) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg md:text-xl">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              {t('triage.title')}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentStep}/{totalSteps}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('triage.subtitle')}</p>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Pain Level */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">{t('triage.pain.title')}</h3>
              </div>
              
              <div>
                <Label className="text-base font-medium">
                  {t('triage.pain.question')}
                </Label>
                <div className="mt-4">
                  <Slider
                    value={painLevel}
                    onValueChange={setPainLevel}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{t('triage.pain.none')}</span>
                    <span className={`font-bold text-lg ${getUrgencyColor(painLevel[0])}`}>
                      {painLevel[0]}/10
                    </span>
                    <span>{t('triage.pain.severe')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">{t('triage.symptoms.title')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'bleeding', key: 'triage.symptoms.bleeding' },
                  { id: 'swelling', key: 'triage.symptoms.swelling' },
                  { id: 'fever', key: 'triage.symptoms.fever' },
                  { id: 'difficulty', key: 'triage.symptoms.difficulty' },
                  { id: 'trauma', key: 'triage.symptoms.trauma' },
                ].map(({ id, key }) => (
                  <div key={id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={id}
                      checked={symptoms.includes(id)}
                      onCheckedChange={(checked) => handleSymptomChange(id, checked === true)}
                    />
                    <Label htmlFor={id} className="text-sm">{t(key)}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">{t('triage.duration.title')}</h3>
              </div>
              
              <div>
                <Label className="text-base font-medium">
                  {t('triage.duration.question')}
                </Label>
                <RadioGroup value={duration} onValueChange={setDuration} className="mt-4">
                  {[
                    { value: 'hours', key: 'triage.duration.hours' },
                    { value: 'day', key: 'triage.duration.day' },
                    { value: 'days', key: 'triage.duration.days' },
                    { value: 'week', key: 'triage.duration.week' },
                  ].map(({ value, key }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value} className="text-sm">{t(key)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 4: Medical History */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">{t('triage.medical.title')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'diabetes', key: 'triage.medical.diabetes' },
                  { id: 'heart', key: 'triage.medical.heart' },
                  { id: 'blood', key: 'triage.medical.blood' },
                  { id: 'immune', key: 'triage.medical.immune' },
                ].map(({ id, key }) => (
                  <div key={id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={id}
                      checked={medicalHistory.includes(id)}
                      onCheckedChange={(checked) => handleMedicalHistoryChange(id, checked === true)}
                    />
                    <Label htmlFor={id} className="text-sm">{t(key)}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            )}
            
            <Button 
              onClick={currentStep < totalSteps ? handleNext : handleNext}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center"
            >
              {currentStep < totalSteps ? (
                <>
                  {t('common.next')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  {t('triage.submit')}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};