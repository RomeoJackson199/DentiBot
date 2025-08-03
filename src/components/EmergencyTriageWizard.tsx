import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity, Clock, Heart, ArrowRight, ArrowLeft, Stethoscope, Shield, FileText } from "lucide-react";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";

interface TriageData {
  painLevel: number;
  symptoms: string[];
  duration: string;
  medicalHistory: string[];
  problemType: string;
  previousTreatment: string;
  allergies: string[];
  urgencyIndicators: string[];
  painDescription: string;
  triggeredBy: string[];
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
  const [problemType, setProblemType] = useState("");
  const [previousTreatment, setPreviousTreatment] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [urgencyIndicators, setUrgencyIndicators] = useState<string[]>([]);
  const [painDescription, setPainDescription] = useState("");
  const [triggeredBy, setTriggeredBy] = useState<string[]>([]);

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  const calculateUrgency = (): 1 | 2 | 3 | 4 | 5 => {
    let score = 0;
    
    // CRITICAL EMERGENCY INDICATORS (automatic level 5)
    const emergencyIndicators = [
      'difficulty_breathing', 'facial_swelling', 'difficulty_swallowing', 
      'high_fever', 'trismus', 'spreading_infection', 'severe_bleeding'
    ];
    const hasEmergencyIndicators = urgencyIndicators.some(indicator => 
      emergencyIndicators.includes(indicator)
    );
    if (hasEmergencyIndicators) return 5;

    // Pain level scoring (0-4 points)
    if (painLevel[0] >= 9) score += 4;
    else if (painLevel[0] >= 7) score += 3;
    else if (painLevel[0] >= 5) score += 2;
    else if (painLevel[0] >= 3) score += 1;
    
    // Problem type severity scoring
    const problemSeverity = {
      'abscess': 4,
      'post_surgery': 3,
      'broken_tooth': 3,
      'toothache': 2,
      'gum_problem': 2,
      'lost_filling': 1,
      'orthodontic': 1,
      'jaw_problem': 2,
      'other': 1
    };
    score += problemSeverity[problemType as keyof typeof problemSeverity] || 1;

    // Pain triggers indicating severity
    const severeTriggers = ['nothing', 'lying_down']; // Constant pain or pain when lying down
    const triggerScore = triggeredBy.filter(t => severeTriggers.includes(t)).length;
    score += triggerScore * 2;

    // Critical symptoms (emergency indicators from basic symptoms)
    const criticalSymptoms = ['difficulty', 'trauma'];
    const hasCritical = symptoms.some(s => criticalSymptoms.includes(s));
    if (hasCritical) score += 4;
    
    // High-risk symptoms
    const highRiskSymptoms = ['bleeding', 'swelling', 'fever'];
    const highRiskCount = symptoms.filter(s => highRiskSymptoms.includes(s)).length;
    score += highRiskCount * 1.5;
    
    // Duration impact (recent onset more urgent for infections/trauma)
    if (duration === 'hours') {
      if (problemType === 'abscess' || problemType === 'broken_tooth') score += 3;
      else score += 2;
    } else if (duration === 'day') {
      score += 1.5;
    } else if (duration === 'days') {
      score += 1;
    }
    
    // Medical history risk factors
    const riskFactors = ['diabetes', 'heart', 'blood', 'immune'];
    const riskCount = medicalHistory.filter(h => riskFactors.includes(h)).length;
    score += riskCount * 1.5;

    // Allergies that may complicate treatment
    const criticalAllergies = ['penicillin', 'local_anesthetic', 'nsaid'];
    const allergyRisk = allergies.filter(a => criticalAllergies.includes(a)).length;
    if (allergyRisk > 0) score += 1;

    // Previous treatment effectiveness
    if (previousTreatment.toLowerCase().includes('antibiotique') && 
        (problemType === 'abscess' || symptoms.includes('swelling'))) {
      score += 2; // Antibiotics not working suggests serious infection
    }

    // Pain description severity
    const severePainWords = ['lancinante', 'insupportable', 'pulsations', 'constante'];
    const painDescWords = painDescription.toLowerCase();
    const painDescScore = severePainWords.filter(word => painDescWords.includes(word)).length;
    score += painDescScore * 0.5;
    
    // Determine urgency level (1-5, where 5 is most urgent)
    if (score >= 12) return 5; // Emergency
    if (score >= 9) return 4;  // High urgency
    if (score >= 6) return 3;  // Medium urgency
    if (score >= 3) return 2;  // Low-medium urgency
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
        medicalHistory,
        problemType,
        previousTreatment,
        allergies,
        urgencyIndicators,
        painDescription,
        triggeredBy
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
      case 5: return problemType !== ""; // Problem type is required
      case 6: return true; // Treatment history is optional
      case 7: return true; // Allergies are optional
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

          {/* Step 5: Problem Type & Pain Description */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold">Type de Problème Dentaire</h3>
              </div>
              
              {/* Problem Type */}
              <div>
                <Label className="text-base font-medium">
                  Quel type de problème dentaire rencontrez-vous ? *
                </Label>
                <RadioGroup value={problemType} onValueChange={setProblemType} className="mt-4">
                  {[
                    { value: 'toothache', label: 'Mal de dent / Douleur dentaire' },
                    { value: 'broken_tooth', label: 'Dent cassée ou fêlée' },
                    { value: 'lost_filling', label: 'Plombage ou couronne tombé(e)' },
                    { value: 'gum_problem', label: 'Problème de gencives' },
                    { value: 'abscess', label: 'Abcès ou infection suspectée' },
                    { value: 'orthodontic', label: 'Problème d\'appareil dentaire' },
                    { value: 'jaw_problem', label: 'Problème de mâchoire (ATM)' },
                    { value: 'post_surgery', label: 'Complications post-opératoires' },
                    { value: 'other', label: 'Autre' }
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Pain Description */}
              <div>
                <Label className="text-base font-medium">
                  Comment décririez-vous votre douleur ?
                </Label>
                <Textarea
                  placeholder="Ex: Douleur lancinante, pulsations, sensibilité au chaud/froid, douleur constante..."
                  value={painDescription}
                  onChange={(e) => setPainDescription(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* What Triggers Pain */}
              <div>
                <Label className="text-base font-medium">
                  Qu'est-ce qui déclenche ou aggrave la douleur ?
                </Label>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {[
                    { id: 'chewing', label: 'Mastiquer' },
                    { id: 'hot', label: 'Boissons/aliments chauds' },
                    { id: 'cold', label: 'Boissons/aliments froids' },
                    { id: 'sweet', label: 'Aliments sucrés' },
                    { id: 'pressure', label: 'Pression (toucher la dent)' },
                    { id: 'lying_down', label: 'Position allongée' },
                    { id: 'nothing', label: 'Douleur constante, rien en particulier' }
                  ].map(({ id, label }) => (
                    <div key={id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={id}
                        checked={triggeredBy.includes(id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTriggeredBy([...triggeredBy, id]);
                          } else {
                            setTriggeredBy(triggeredBy.filter(t => t !== id));
                          }
                        }}
                      />
                      <Label htmlFor={id} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Treatment History & Urgency Indicators */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Traitements & Indicateurs d'Urgence</h3>
              </div>
              
              {/* Previous Treatment */}
              <div>
                <Label className="text-base font-medium">
                  Avez-vous pris des médicaments pour cette douleur ?
                </Label>
                <Textarea
                  placeholder="Ex: Paracétamol 1g toutes les 6h, Ibuprofène 400mg, antibiotiques..."
                  value={previousTreatment}
                  onChange={(e) => setPreviousTreatment(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Urgency Indicators */}
              <div>
                <Label className="text-base font-medium">
                  Présentez-vous l'un de ces signes inquiétants ? ⚠️
                </Label>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {[
                    { id: 'facial_swelling', label: '🔴 Gonflement important du visage' },
                    { id: 'difficulty_swallowing', label: '🔴 Difficulté à avaler' },
                    { id: 'difficulty_breathing', label: '🚨 Difficulté à respirer' },
                    { id: 'high_fever', label: '🔴 Fièvre élevée (>38.5°C)' },
                    { id: 'trismus', label: '🔴 Impossibilité d\'ouvrir la bouche' },
                    { id: 'spreading_infection', label: '🔴 Infection qui semble se propager' },
                    { id: 'severe_bleeding', label: '🔴 Saignement important difficile à arrêter' },
                    { id: 'jaw_locked', label: '🔴 Mâchoire bloquée' }
                  ].map(({ id, label }) => (
                    <div key={id} className="flex items-center space-x-3 p-2 rounded-lg border border-red-200 bg-red-50">
                      <Checkbox 
                        id={id}
                        checked={urgencyIndicators.includes(id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUrgencyIndicators([...urgencyIndicators, id]);
                          } else {
                            setUrgencyIndicators(urgencyIndicators.filter(u => u !== id));
                          }
                        }}
                      />
                      <Label htmlFor={id} className="text-sm text-red-800">{label}</Label>
                    </div>
                  ))}
                </div>
                {urgencyIndicators.length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Signes d'urgence détectés - Une consultation immédiate est recommandée
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Allergies & Final Details */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold">Allergies & Informations Médicales</h3>
              </div>
              
              {/* Allergies */}
              <div>
                <Label className="text-base font-medium">
                  Avez-vous des allergies médicamenteuses ?
                </Label>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {[
                    { id: 'penicillin', label: 'Pénicilline / Amoxicilline' },
                    { id: 'sulfa', label: 'Sulfamides' },
                    { id: 'local_anesthetic', label: 'Anesthésiques locaux (lidocaïne, etc.)' },
                    { id: 'latex', label: 'Latex' },
                    { id: 'iodine', label: 'Iode' },
                    { id: 'nsaid', label: 'Anti-inflammatoires (aspirine, ibuprofène)' },
                    { id: 'codeine', label: 'Codéine / Morphine' },
                    { id: 'other_allergy', label: 'Autres allergies' },
                    { id: 'no_allergies', label: 'Aucune allergie connue' }
                  ].map(({ id, label }) => (
                    <div key={id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={id}
                        checked={allergies.includes(id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (id === 'no_allergies') {
                              setAllergies(['no_allergies']);
                            } else {
                              setAllergies([...allergies.filter(a => a !== 'no_allergies'), id]);
                            }
                          } else {
                            setAllergies(allergies.filter(a => a !== id));
                          }
                        }}
                      />
                      <Label htmlFor={id} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Assessment Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Résumé de votre évaluation :</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p><strong>Niveau de douleur :</strong> {painLevel[0]}/10</p>
                  <p><strong>Type de problème :</strong> {problemType}</p>
                  <p><strong>Durée :</strong> {duration}</p>
                  {symptoms.length > 0 && (
                    <p><strong>Symptômes :</strong> {symptoms.length} symptôme(s) sélectionné(s)</p>
                  )}
                  {urgencyIndicators.length > 0 && (
                    <p className="text-red-600 font-medium">
                      <strong>⚠️ Signes d'urgence :</strong> {urgencyIndicators.length} détecté(s)
                    </p>
                  )}
                </div>
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