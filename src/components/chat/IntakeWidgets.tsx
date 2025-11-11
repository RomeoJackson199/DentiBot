/**
 * AI Intake Widgets
 *
 * Interactive widgets for the AI conversational intake flow:
 * - Symptom Selector
 * - Pain Scale
 * - Urgency Assessment
 * - Medical History Form
 * - Quick Response Buttons
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Activity,
  Droplet,
  Smile,
  Zap,
  Clock,
  Heart,
  CheckCircle,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { SymptomCategory, Symptom } from '@/types/intake';
import { cn } from '@/lib/utils';

// =====================================================
// SYMPTOM SELECTOR WIDGET
// =====================================================

interface SymptomSelectorWidgetProps {
  onSymptomSelect: (symptom: Partial<Symptom>) => void;
  selectedSymptoms?: Partial<Symptom>[];
}

const symptomOptions: { category: SymptomCategory; label: string; icon: any; color: string }[] = [
  { category: 'pain', label: 'Tooth Pain', icon: AlertCircle, color: 'text-red-500' },
  { category: 'bleeding', label: 'Bleeding Gums', icon: Droplet, color: 'text-red-400' },
  { category: 'swelling', label: 'Swelling', icon: Activity, color: 'text-orange-500' },
  { category: 'sensitivity', label: 'Sensitivity', icon: Zap, color: 'text-yellow-500' },
  { category: 'broken_tooth', label: 'Broken Tooth', icon: AlertCircle, color: 'text-red-600' },
  { category: 'missing_tooth', label: 'Missing Tooth', icon: X, color: 'text-gray-500' },
  { category: 'jaw_issues', label: 'Jaw Problems', icon: Activity, color: 'text-blue-500' },
  { category: 'gum_issues', label: 'Gum Issues', icon: Heart, color: 'text-pink-500' },
  { category: 'cosmetic', label: 'Cosmetic Concern', icon: Smile, color: 'text-purple-500' },
  { category: 'routine_checkup', label: 'Routine Checkup', icon: CheckCircle, color: 'text-green-500' }
];

export const SymptomSelectorWidget = ({ onSymptomSelect, selectedSymptoms = [] }: SymptomSelectorWidgetProps) => {
  const isSelected = (category: SymptomCategory) => {
    return selectedSymptoms.some(s => s.category === category);
  };

  return (
    <Card className="max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg">What brings you in today?</CardTitle>
        <CardDescription>Select all that apply</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {symptomOptions.map(({ category, label, icon: Icon, color }) => (
            <Button
              key={category}
              variant={isSelected(category) ? 'default' : 'outline'}
              className={cn(
                "h-auto flex-col gap-2 p-4",
                !isSelected(category) && "hover:border-primary"
              )}
              onClick={() => onSymptomSelect({ category, text: label })}
            >
              <Icon className={cn("h-6 w-6", isSelected(category) ? "text-primary-foreground" : color)} />
              <span className="text-sm font-medium text-center">{label}</span>
              {isSelected(category) && (
                <CheckCircle className="h-4 w-4 absolute top-2 right-2" />
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// PAIN SCALE WIDGET
// =====================================================

interface PainScaleWidgetProps {
  onPainLevelSelect: (level: number) => void;
  currentLevel?: number;
}

export const PainScaleWidget = ({ onPainLevelSelect, currentLevel }: PainScaleWidgetProps) => {
  const [painLevel, setPainLevel] = useState(currentLevel || 5);

  const getPainColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 6) return 'text-yellow-500';
    if (level <= 8) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPainLabel = (level: number) => {
    if (level === 0) return 'No Pain';
    if (level <= 3) return 'Mild Pain';
    if (level <= 6) return 'Moderate Pain';
    if (level <= 8) return 'Severe Pain';
    return 'Extreme Pain';
  };

  const handleSubmit = () => {
    onPainLevelSelect(painLevel);
  };

  return (
    <Card className="max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg">How much pain are you experiencing?</CardTitle>
        <CardDescription>Move the slider to rate your pain level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Pain Scale */}
        <div className="text-center">
          <div className={cn("text-6xl font-bold mb-2", getPainColor(painLevel))}>
            {painLevel}
          </div>
          <div className={cn("text-xl font-semibold", getPainColor(painLevel))}>
            {getPainLabel(painLevel)}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <Slider
            value={[painLevel]}
            onValueChange={([value]) => setPainLevel(value)}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 - No Pain</span>
            <span>5 - Moderate</span>
            <span>10 - Worst Pain</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

// =====================================================
// DURATION SELECTOR WIDGET
// =====================================================

interface DurationSelectorWidgetProps {
  onDurationSelect: (duration: string) => void;
}

const durationOptions = [
  { value: 'hours', label: 'A few hours', icon: Clock },
  { value: '1-2days', label: '1-2 days', icon: Clock },
  { value: 'week', label: 'About a week', icon: Clock },
  { value: 'weeks', label: 'Several weeks', icon: Clock },
  { value: 'month', label: 'A month or more', icon: Clock },
  { value: 'chronic', label: 'Ongoing/Chronic', icon: Activity }
];

export const DurationSelectorWidget = ({ onDurationSelect }: DurationSelectorWidgetProps) => {
  return (
    <Card className="max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg">How long have you had this symptom?</CardTitle>
        <CardDescription>This helps us assess the urgency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {durationOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              className="h-auto justify-start gap-3 p-4 hover:border-primary"
              onClick={() => onDurationSelect(label)}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// MEDICAL HISTORY WIDGET
// =====================================================

interface MedicalHistoryWidgetProps {
  onSubmit: (data: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    notes?: string;
  }) => void;
}

export const MedicalHistoryWidget = ({ onSubmit }: MedicalHistoryWidgetProps) => {
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [hasNone, setHasNone] = useState(false);

  const handleSubmit = () => {
    if (hasNone) {
      onSubmit({ allergies: [], medications: [], conditions: [], notes: 'No medical history' });
    } else {
      onSubmit({
        allergies: allergies.split(',').map(a => a.trim()).filter(Boolean),
        medications: medications.split(',').map(m => m.trim()).filter(Boolean),
        conditions: conditions.split(',').map(c => c.trim()).filter(Boolean),
        notes
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg">Medical History</CardTitle>
        <CardDescription>
          Help us provide safer care by sharing relevant medical information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick "None" Option */}
        <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="no-history"
            checked={hasNone}
            onCheckedChange={(checked) => setHasNone(checked as boolean)}
          />
          <Label htmlFor="no-history" className="text-sm cursor-pointer">
            I have no allergies, medications, or medical conditions to report
          </Label>
        </div>

        {!hasNone && (
          <>
            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                placeholder="e.g., Penicillin, Latex (separate with commas)"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Input
                id="medications"
                placeholder="e.g., Aspirin, Blood pressure medication"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />
            </div>

            {/* Medical Conditions */}
            <div className="space-y-2">
              <Label htmlFor="conditions">Medical Conditions</Label>
              <Input
                id="conditions"
                placeholder="e.g., Diabetes, Heart disease"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any other relevant medical information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

// =====================================================
// QUICK RESPONSE BUTTONS
// =====================================================

interface QuickResponseButtonsProps {
  options: string[];
  onSelect: (response: string) => void;
}

export const QuickResponseButtons = ({ options, onSelect }: QuickResponseButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2 my-4 justify-center max-w-2xl mx-auto">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onSelect(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
};

// =====================================================
// URGENCY INDICATOR
// =====================================================

interface UrgencyIndicatorProps {
  urgencyScore: number;
  urgencyLevel: string;
  reasoning?: string;
}

export const UrgencyIndicator = ({ urgencyScore, urgencyLevel, reasoning }: UrgencyIndicatorProps) => {
  const getUrgencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'emergency':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'urgent':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'high':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'border-green-500 bg-green-50 dark:bg-green-950';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'emergency':
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Card className={cn("max-w-2xl mx-auto my-4 border-2", getUrgencyColor(urgencyLevel))}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {getUrgencyIcon(urgencyLevel)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">Urgency Assessment</h4>
              <Badge variant="outline">{urgencyLevel.toUpperCase()}</Badge>
              <span className="text-sm text-muted-foreground">Score: {urgencyScore}/10</span>
            </div>
            {reasoning && (
              <p className="text-sm text-muted-foreground">{reasoning}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Export all widgets
export default {
  SymptomSelectorWidget,
  PainScaleWidget,
  DurationSelectorWidget,
  MedicalHistoryWidget,
  QuickResponseButtons,
  UrgencyIndicator
};
