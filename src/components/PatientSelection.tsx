import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Users, Baby, Child, UserCheck, Plus, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientInfo {
  name: string;
  age: number;
  relationship: string;
}

interface PatientSelectionProps {
  onSelectPatient: (isForUser: boolean, patientInfo: PatientInfo) => void;
  onCancel: () => void;
}

export const PatientSelection = ({ onSelectPatient, onCancel }: PatientSelectionProps) => {
  const [selectedOption, setSelectedOption] = useState<'me' | 'other' | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: 0,
    relationship: ''
  });

  const handleSelectOption = (option: 'me' | 'other') => {
    setSelectedOption(option);
    if (option === 'me') {
      onSelectPatient(true, { name: 'You', age: 25, relationship: 'self' });
    }
  };

  const handleSubmitOther = () => {
    if (patientInfo.name && patientInfo.age > 0) {
      onSelectPatient(false, patientInfo);
    }
  };

  const canSubmitOther = patientInfo.name.trim() && patientInfo.age > 0;

  const relationshipOptions = [
    { value: 'child', label: 'Child', icon: '👶' },
    { value: 'spouse', label: 'Spouse', icon: '💑' },
    { value: 'parent', label: 'Parent', icon: '👴' },
    { value: 'sibling', label: 'Sibling', icon: '👥' },
    { value: 'other', label: 'Other', icon: '👤' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Who is this appointment for?
          </CardTitle>
          <p className="text-gray-600">
            Select who needs the dental appointment
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Option Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* For Me Option */}
            <div
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedOption === 'me'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectOption('me')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">For Me</h3>
                  <p className="text-sm text-gray-600">Book appointment for myself</p>
                </div>
              </div>
              {selectedOption === 'me' && (
                <Badge className="mt-3 bg-blue-500 text-white">
                  Selected
                </Badge>
              )}
            </div>

            {/* For Someone Else Option */}
            <div
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedOption === 'other'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('other')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">For Someone Else</h3>
                  <p className="text-sm text-gray-600">Book appointment for family member</p>
                </div>
              </div>
              {selectedOption === 'other' && (
                <Badge className="mt-3 bg-green-500 text-white">
                  Selected
                </Badge>
              )}
            </div>
          </div>

          {/* Patient Information Form */}
          {selectedOption === 'other' && (
            <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                    placeholder="Enter full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientInfo.age || ''}
                    onChange={(e) => setPatientInfo({ ...patientInfo, age: parseInt(e.target.value) || 0 })}
                    placeholder="Enter age"
                    className="mt-1"
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {relationshipOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        patientInfo.relationship === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPatientInfo({ ...patientInfo, relationship: option.value })}
                    >
                      <div className="text-lg mb-1">{option.icon}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age-based Recommendations */}
              {patientInfo.age > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    {patientInfo.age < 16 ? (
                      <Baby className="w-5 h-5 text-blue-600 mt-0.5" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {patientInfo.age < 16 ? 'Pediatric Care Recommended' : 'General Care Recommended'}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {patientInfo.age < 16 
                          ? 'We recommend our pediatric dentists for children under 16'
                          : 'Our general dentists can provide comprehensive care for adults'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            
            {selectedOption === 'other' && (
              <Button
                onClick={handleSubmitOther}
                disabled={!canSubmitOther}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};