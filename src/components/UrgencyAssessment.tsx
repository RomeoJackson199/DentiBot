import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Activity } from "lucide-react";

interface UrgencyAssessmentProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency') => void;
  onCancel: () => void;
}

export const UrgencyAssessment = ({ onComplete, onCancel }: UrgencyAssessmentProps) => {
  const [painLevel, setPainLevel] = useState([5]);
  const [hasBleeding, setHasBleeding] = useState(false);
  const [hasSwelling, setHasSwelling] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");

  const calculateUrgency = () => {
    let score = 0;
    
    // Pain level scoring
    if (painLevel[0] >= 8) score += 4;
    else if (painLevel[0] >= 6) score += 3;
    else if (painLevel[0] >= 4) score += 2;
    else score += 1;
    
    // Additional symptoms
    if (hasBleeding) score += 2;
    if (hasSwelling) score += 2;
    
    // Duration (urgent if recent and severe)
    if (duration.includes("aujourd'hui") || duration.includes("hier")) {
      if (painLevel[0] >= 7) score += 2;
    }
    
    // Determine urgency level
    if (score >= 8) return 'emergency';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const handleSubmit = () => {
    const urgency = calculateUrgency();
    onComplete(urgency);
  };

  const getUrgencyColor = (level: number) => {
    if (level <= 3) return "text-green-600";
    if (level <= 6) return "text-yellow-600";
    if (level <= 8) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Évaluation de l'urgence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">
            Sur une échelle de 1 à 10, quel est votre niveau de douleur ?
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
              <span>Aucune douleur (1)</span>
              <span className={`font-medium ${getUrgencyColor(painLevel[0])}`}>
                {painLevel[0]}/10
              </span>
              <span>Douleur insupportable (10)</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">Symptômes supplémentaires :</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="bleeding" 
              checked={hasBleeding}
              onCheckedChange={(checked) => setHasBleeding(checked === true)}
            />
            <Label htmlFor="bleeding">Saignement des gencives ou de la dent</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="swelling" 
              checked={hasSwelling}
              onCheckedChange={(checked) => setHasSwelling(checked === true)}
            />
            <Label htmlFor="swelling">Gonflement du visage ou des gencives</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="duration">Depuis quand avez-vous ces symptômes ?</Label>
          <Textarea
            id="duration"
            placeholder="Ex: Depuis ce matin, depuis 3 jours..."
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="symptoms">Décrivez vos symptômes en détail :</Label>
          <Textarea
            id="symptoms"
            placeholder="Ex: Douleur lancinante, sensibilité au chaud/froid..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex space-x-3">
          <Button onClick={handleSubmit} className="flex-1">
            <Activity className="h-4 w-4 mr-2" />
            Évaluer l'urgence
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
