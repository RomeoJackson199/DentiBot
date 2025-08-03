import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Stethoscope,
  ThermometerSun,
  Zap,
  X,
  Droplets,
  Heart,
  Brain,
  Eye
} from "lucide-react";

interface TriageAnswers {
  painLevel: number;
  symptoms: string[];
  urgency: string[];
}

interface StreamlinedTriageProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency', data: TriageAnswers) => void;
  onCancel: () => void;
}

export const StreamlinedTriage = ({ onComplete, onCancel }: StreamlinedTriageProps) => {
  const steps = ["pain", "symptoms", "urgency"];
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<TriageAnswers>({
    painLevel: 5,
    symptoms: [],
    urgency: []
  });
  useLanguage();
  const progress = (currentStep / totalSteps) * 100;

  // Question 1: Pain Level with Emoji Scale
  const painLevels = [
    { value: 1, emoji: "😊", label: "No Pain", color: "text-green-500" },
    { value: 2, emoji: "🙂", label: "Mild", color: "text-green-400" },
    { value: 3, emoji: "😐", label: "Discomfort", color: "text-yellow-500" },
    { value: 4, emoji: "😕", label: "Moderate", color: "text-yellow-400" },
    { value: 5, emoji: "😟", label: "Noticeable", color: "text-orange-500" },
    { value: 6, emoji: "😣", label: "Uncomfortable", color: "text-orange-400" },
    { value: 7, emoji: "😖", label: "Painful", color: "text-red-500" },
    { value: 8, emoji: "😫", label: "Very Painful", color: "text-red-400" },
    { value: 9, emoji: "😩", label: "Severe", color: "text-red-600" },
    { value: 10, emoji: "😵", label: "Worst", color: "text-red-700" }
  ];

  // Question 2: Key Symptoms (Smart Conditional Logic)
  const symptoms = [
    { id: 'toothache', label: 'Toothache', icon: '🦷', urgent: false },
    { id: 'swelling', label: 'Swelling', icon: '😷', urgent: true },
    { id: 'bleeding', label: 'Bleeding', icon: '🩸', urgent: true },
    { id: 'sensitivity', label: 'Sensitivity', icon: '❄️', urgent: false },
    { id: 'loose_tooth', label: 'Loose Tooth', icon: '🦷', urgent: true },
    { id: 'jaw_pain', label: 'Jaw Pain', icon: '😬', urgent: false },
    { id: 'headache', label: 'Headache', icon: '🤕', urgent: false },
    { id: 'fever', label: 'Fever', icon: '🤒', urgent: true }
  ];

  // Question 3: Urgency Indicators (Conditional based on previous answers)
  const urgencyIndicators = [
    { id: 'breathing_difficulty', label: 'Difficulty breathing or swallowing', icon: <Droplets className="h-5 w-5" />, urgent: true },
    { id: 'severe_swelling', label: 'Severe facial swelling', icon: <AlertTriangle className="h-5 w-5" />, urgent: true },
    { id: 'trauma', label: 'Recent dental trauma or injury', icon: <Zap className="h-5 w-5" />, urgent: true },
    { id: 'infection', label: 'Signs of infection (pus, bad taste)', icon: <ThermometerSun className="h-5 w-5" />, urgent: true },
    { id: 'pregnancy', label: 'Pregnant or nursing', icon: <Heart className="h-5 w-5" />, urgent: false },
    { id: 'medication', label: 'Taking blood thinners', icon: <Brain className="h-5 w-5" />, urgent: false },
    { id: 'diabetes', label: 'Diabetes or heart condition', icon: <Heart className="h-5 w-5" />, urgent: false },
    { id: 'vision', label: 'Vision changes with pain', icon: <Eye className="h-5 w-5" />, urgent: true }
  ];

  const calculateUrgency = () => {
    let score = 0;
    
    // Pain level scoring (0-4 points)
    if (answers.painLevel >= 9) score += 4;
    else if (answers.painLevel >= 7) score += 3;
    else if (answers.painLevel >= 5) score += 2;
    else if (answers.painLevel >= 3) score += 1;
    
    // Symptom scoring (0-3 points)
    const urgentSymptoms = answers.symptoms.filter(s => 
      symptoms.find(sym => sym.id === s)?.urgent
    );
    score += urgentSymptoms.length * 2;

    // Urgency indicator scoring (0-4 points)
    const urgentIndicators = answers.urgency.filter(u => 
      urgencyIndicators.find(ind => ind.id === u)?.urgent
    );
    score += urgentIndicators.length * 2;

    // Determine urgency level
    if (score >= 8) return 'emergency';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  const getUrgencyDisplay = () => {
    const urgency = calculateUrgency();
    switch (urgency) {
      case 'emergency':
        return {
          title: '🚨 EMERGENCY',
          description: 'Immediate care required',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          timeframe: 'Within 1 hour',
          action: 'Call Emergency Line'
        };
      case 'high':
        return {
          title: '⚠️ URGENT',
          description: 'Care needed soon',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          timeframe: 'Within 24 hours',
          action: 'Book Urgent Appointment'
        };
      case 'medium':
        return {
          title: '📋 MODERATE',
          description: 'Care needed soon',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          timeframe: 'Within 3 days',
          action: 'Book Regular Appointment'
        };
      default:
        return {
          title: '✅ ROUTINE',
          description: 'Non-urgent care',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          timeframe: 'Within 1 week',
          action: 'Book Routine Appointment'
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
        ? prev.symptoms.filter(id => id !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const toggleUrgency = (urgencyId: string) => {
    setAnswers(prev => ({
      ...prev,
      urgency: prev.urgency.includes(urgencyId)
        ? prev.urgency.filter(id => id !== urgencyId)
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
                {urgencyDisplay.title}
              </Badge>
            </div>
            <p className="text-center text-sm text-dental-muted-foreground mt-2">
              {urgencyDisplay.description}
            </p>
            <p className="text-center text-sm text-dental-muted-foreground mt-2">
              Timeframe: {urgencyDisplay.timeframe}
            </p>
            <p className="text-center text-sm text-dental-muted-foreground mt-2">
              Action: {urgencyDisplay.action}
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
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {painLevels.find(p => p.value === answers.painLevel)?.emoji}
                </div>
                <div className="text-2xl font-bold gradient-text">
                  {answers.painLevel}/10
                </div>
                <div className="text-dental-muted-foreground">
                  {painLevels.find(p => p.value === answers.painLevel)?.label}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pain Level</Label>
                <Slider
                  value={[answers.painLevel]}
                  onValueChange={(value) => setAnswers(prev => ({ ...prev, painLevel: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dental-muted-foreground">
                  <span>No Pain</span>
                  <span>Worst Pain</span>
                </div>
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
                  <div className="flex items-center space-x-3">
                    <span className="text-dental-primary">{indicator.icon}</span>
                    <div>
                      <div className="font-medium">{indicator.label}</div>
                      {indicator.urgent && (
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
