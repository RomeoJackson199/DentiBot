import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Users, ArrowRight } from "lucide-react";

interface PatientInfo {
  name: string;
  age: number;
  relationship: string;
}

interface PatientSelectionProps {
  onSelectPatient: (isForUser: boolean, patientInfo?: PatientInfo) => void;
  onCancel: () => void;
}

export const PatientSelection = ({ onSelectPatient, onCancel }: PatientSelectionProps) => {
  const [selectedOption, setSelectedOption] = useState<'self' | 'other' | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: 0,
    relationship: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!patientInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!patientInfo.age || patientInfo.age < 1) {
      newErrors.age = 'Valid age is required';
    }
    
    if (!patientInfo.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (selectedOption === 'self') {
      onSelectPatient(true);
    } else if (selectedOption === 'other' && validateForm()) {
      onSelectPatient(false, patientInfo);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold gradient-text mb-2">Who is this appointment for?</h3>
        <p className="text-dental-muted-foreground">
          Select whether you're booking for yourself or someone else
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
            selectedOption === 'self' 
              ? 'border-dental-primary shadow-elegant bg-dental-primary/5' 
              : 'floating-card hover:shadow-float'
          }`}
          onClick={() => setSelectedOption('self')}
        >
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-white" />
              </div>
              {selectedOption === 'self' && (
                <Badge className="absolute -top-2 -right-2 bg-dental-secondary text-white">
                  Selected
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-dental-primary mb-2">For Myself</h4>
            <p className="text-sm text-dental-muted-foreground">
              Book an appointment for yourself
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
            selectedOption === 'other' 
              ? 'border-dental-primary shadow-elegant bg-dental-primary/5' 
              : 'floating-card hover:shadow-float'
          }`}
          onClick={() => setSelectedOption('other')}
        >
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-white" />
              </div>
              {selectedOption === 'other' && (
                <Badge className="absolute -top-2 -right-2 bg-dental-secondary text-white">
                  Selected
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-dental-primary mb-2">For Someone Else</h4>
            <p className="text-sm text-dental-muted-foreground">
              Book for family member or child
            </p>
          </CardContent>
        </Card>
      </div>

      {selectedOption === 'other' && (
        <Card className="floating-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-dental-primary" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Full Name *</Label>
              <Input
                id="patientName"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                placeholder="Enter patient's full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientAge">Age *</Label>
              <Input
                id="patientAge"
                type="number"
                value={patientInfo.age || ''}
                onChange={(e) => setPatientInfo({ ...patientInfo, age: parseInt(e.target.value) || 0 })}
                placeholder="Enter age"
                min="1"
                max="120"
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship to You *</Label>
              <Select 
                value={patientInfo.relationship} 
                onValueChange={(value) => setPatientInfo({ ...patientInfo, relationship: value })}
              >
                <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="spouse">Spouse/Partner</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="grandchild">Grandchild</SelectItem>
                  <SelectItem value="other">Other Family Member</SelectItem>
                </SelectContent>
              </Select>
              {errors.relationship && <p className="text-sm text-red-500">{errors.relationship}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleContinue}
          disabled={!selectedOption}
          className="bg-gradient-primary text-white hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
