import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Stethoscope,
  ThermometerSun,
  Zap
} from "lucide-react";

interface StreamlinedTriageProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency', data: any) => void;
  onCancel: () => void;
}

export const StreamlinedTriage = ({ onComplete, onCancel }: StreamlinedTriageProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    painLevel: 5,
    symptoms: [] as string[],
    urgency: [] as string[]
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Question 1: Pain Level with Emoji Scale
  const painLevels = [
    { value: 1, emoji: "😊", label: "No Pain", color: "text-green-600" },
    { value: 2, emoji: "🙂", label: "Mild", color: "text-green-500" },
    { value: 3, emoji: "😐", label: "Moderate", color: "text-yellow-500" },
    { value: 4, emoji: "😟", label: "Uncomfortable", color: "text-yellow-600" },
    { value: 5, emoji: "😣", label: "Painful", color: "text-orange-500" },
    { value: 6, emoji: "😰", label: "Very Painful", color: "text-orange-600" },
    { value: 7, emoji: "😫", label: "Intense", color: "text-red-500" },
    { value: 8, emoji: "😭", label: "Severe", color: "text-red-600" },
    { value: 9, emoji: "😱", label: "Extreme", color: "text-red-700" },
    { value: 10, emoji: "🤯", label: "Unbearable", color: "text-red-800" }
  ];

  // Question 2: Key Symptoms (Smart Conditional Logic)
  const symptoms = [
    { id: 'bleeding', label: 'Bleeding gums or tooth', urgent: true, icon: '🩸' },
    { id: 'swelling', label: 'Facial or gum swelling', urgent: true, icon: '🫧' },
    { id: 'fever', label: 'Fever or feeling unwell', urgent: true, icon: '🤒' },
    { id: 'difficulty', label: 'Trouble speaking/swallowing', urgent: true, icon: '😵' },
    { id: 'broken', label: 'Broken/cracked tooth', urgent: false, icon: '🦷' },
    { id: 'sensitivity', label: 'Hot/cold sensitivity', urgent: false, icon: '🧊' },
    { id: 'throbbing', label: 'Throbbing pain', urgent: false, icon: '💫' },
    { id: 'lost_filling', label: 'Lost filling/crown', urgent: false, icon: '⚪' }
  ];

  // Question 3: Urgency Indicators (Conditional based on previous answers)
  const urgencyIndicators = [
    { id: 'worsening', label: 'Getting worse rapidly', weight: 3 },
    { id: 'interfering', label: 'Can\'t sleep or work', weight: 2 },
    { id: 'recent', label: 'Started in last 24 hours', weight: 2 },
    { id: 'constant', label: 'Pain is constant', weight: 2 },
    { id: 'medications', label: 'Pain meds not helping', weight: 1 },
    { id: 'medical_history', label: 'Have diabetes/heart condition', weight: 1 }
  ];

  const calculateUrgency = () => {
    let score = 0;
    
    // Pain level scoring (0-4 points)
    if (answers.painLevel >= 9) score += 4;
    else if (answers.painLevel >= 7) score += 3;
    else if (answers.painLevel >= 5) score += 2;
    else if (answers.painLevel >= 3) score += 1;
    
    // Critical symptoms (automatic emergency)
    const criticalSymptoms = ['fever', 'difficulty'];
    const hasCritical = answers.symptoms.some(s => criticalSymptoms.includes(s));
    if (hasCritical) return 'emergency';
    
    // Urgent symptoms (2 points each)
    const urgentSymptoms = ['bleeding', 'swelling'];
    const urgentCount = answers.symptoms.filter(s => urgentSymptoms.includes(s)).length;
    score += urgentCount * 2;
    
    // Other symptoms (1 point each)
    const otherSymptoms = ['broken', 'throbbing'];
    const otherCount = answers.symptoms.filter(s => otherSymptoms.includes(s)).length;
    score += otherCount * 1;
    
    // Urgency indicators
    answers.urgency.forEach(indicator => {
      const weight = urgencyIndicators.find(u => u.id === indicator)?.weight || 0;
      score += weight;
    });
    
    // Determine urgency level
    if (score >= 8) return 'emergency';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  const getUrgencyDisplay = () => {
    const urgency = calculateUrgency();
    switch(urgency) {
      case 'emergency': 
        return { 
          text: 'EMERGENCY - Immediate Care', 
          color: 'bg-red-100 text-red-800 border-red-300', 
          icon: AlertTriangle,
          description: 'You need immediate dental attention. Please call now.' 
        };
      case 'high': 
        return { 
          text: 'HIGH PRIORITY - Same Day', 
          color: 'bg-orange-100 text-orange-800 border-orange-300', 
          icon: Zap,
          description: 'Schedule an appointment today if possible.' 
        };
      case 'medium': 
        return { 
          text: 'MEDIUM - Within 24-48 Hours', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
          icon: Clock,
          description: 'Schedule within the next day or two.' 
        };
      case 'low': 
        return { 
          text: 'LOW - Standard Appointment', 
          color: 'bg-green-100 text-green-800 border-green-300', 
          icon: Activity,
          description: 'Schedule at your convenience.' 
        };
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      const urgency = calculateUrgency();
      onComplete(urgency, answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSymptom = (symptomId: string) => {
    setAnswers(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId) 
        ? prev.symptoms.filter(s => s !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const toggleUrgency = (urgencyId: string) => {
    setAnswers(prev => ({
      ...prev,
      urgency: prev.urgency.includes(urgencyId) 
        ? prev.urgency.filter(u => u !== urgencyId)
        : [...prev.urgency, urgencyId]
    }));
  };

  const urgencyDisplay = getUrgencyDisplay();
  const IconComponent = urgencyDisplay.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            3 quick questions to assess your urgency level
          </p>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-dental-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Current Urgency Level Display */}
      {currentStep > 1 && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <IconComponent className="h-6 w-6" />
              <Badge className={`text-lg py-2 px-4 border ${urgencyDisplay.color}`}>
                {urgencyDisplay.text}
              </Badge>
            </div>
            <p className="text-center text-sm text-dental-muted-foreground mt-2">
              {urgencyDisplay.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question 1: Pain Level with Visual Scale */}
      {currentStep === 1 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-dental-primary" />
              Question 1: How would you rate your pain?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {painLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setAnswers(prev => ({ ...prev, painLevel: level.value }))}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    answers.painLevel === level.value 
                      ? 'border-dental-primary bg-dental-primary/10 shadow-elegant' 
                      : 'border-white/20 bg-white/5 hover:border-dental-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{level.emoji}</div>
                  <div className={`text-lg font-bold ${level.color}`}>{level.value}</div>
                  <div className="text-xs text-dental-muted-foreground">{level.label}</div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {painLevels.find(p => p.value === answers.painLevel)?.emoji} {answers.painLevel}/10
              </div>
              <div className="text-dental-muted-foreground">
                {painLevels.find(p => p.value === answers.painLevel)?.label}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 2: Key Symptoms */}
      {currentStep === 2 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-dental-secondary" />
              Question 2: What symptoms are you experiencing?
            </CardTitle>
            <p className="text-sm text-dental-muted-foreground">Select all that apply</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {symptoms.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 hover:scale-105 ${
                    answers.symptoms.includes(symptom.id)
                      ? 'border-dental-primary bg-dental-primary/10 shadow-elegant' 
                      : 'border-white/20 bg-white/5 hover:border-dental-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{symptom.icon}</span>
                    <div>
                      <div className="font-medium">{symptom.label}</div>
                      {symptom.urgent && (
                        <Badge variant="destructive" className="text-xs mt-1">URGENT</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 3: Urgency Indicators */}
      {currentStep === 3 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ThermometerSun className="h-5 w-5 mr-2 text-dental-accent" />
              Question 3: Additional factors
            </CardTitle>
            <p className="text-sm text-dental-muted-foreground">Select any that apply to your situation</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {urgencyIndicators.map((indicator) => (
                <button
                  key={indicator.id}
                  onClick={() => toggleUrgency(indicator.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 hover:scale-105 ${
                    answers.urgency.includes(indicator.id)
                      ? 'border-dental-primary bg-dental-primary/10 shadow-elegant' 
                      : 'border-white/20 bg-white/5 hover:border-dental-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{indicator.label}</span>
                    <Badge variant="outline" className="text-xs">
                      +{indicator.weight}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={currentStep === 1 ? onCancel : handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button 
              onClick={handleNext}
              className="bg-gradient-primary text-white shadow-elegant flex items-center"
            >
              {currentStep === totalSteps ? 'Complete Assessment' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
