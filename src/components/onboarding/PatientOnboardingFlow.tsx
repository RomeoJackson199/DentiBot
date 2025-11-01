import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Heart,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Bell,
  Camera,
  Users,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface PatientOnboardingData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;

  // Step 2: Medical History
  hasAllergies: boolean;
  allergies: string;
  hasMedications: boolean;
  medications: string;
  hasConditions: boolean;
  conditions: string;

  // Step 3: Dental History
  lastDentalVisit: string;
  dentalConcerns: string[];

  // Step 4: Preferences
  preferredAppointmentTime: string;
  communicationPreference: string;

  // Step 5: Terms
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedHIPAA: boolean;
}

export const PatientOnboardingFlow = ({ isOpen, onClose, userId }: PatientOnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [data, setData] = useState<PatientOnboardingData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    hasAllergies: false,
    allergies: "",
    hasMedications: false,
    medications: "",
    hasConditions: false,
    conditions: "",
    lastDentalVisit: "less-than-6-months",
    dentalConcerns: [],
    preferredAppointmentTime: "morning",
    communicationPreference: "email",
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedHIPAA: false,
  });

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateData = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  const toggleConcern = (concern: string) => {
    if (data.dentalConcerns.includes(concern)) {
      updateData("dentalConcerns", data.dentalConcerns.filter((c) => c !== concern));
    } else {
      updateData("dentalConcerns", [...data.dentalConcerns, concern]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_data: data,
          role: 'patient',
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Welcome to Caberu!",
        description: "Your patient profile is all set up.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to Caberu!",
      description: "Your smart dental care companion",
      icon: Sparkles,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome to Caberu!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We make dental care simple, convenient, and stress-free.
                Let's set up your profile in just 2 minutes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">Easy Booking</h4>
              <p className="text-xs text-gray-600">Schedule appointments 24/7</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-cyan-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">AI Assistant</h4>
              <p className="text-xs text-gray-600">Get instant dental answers</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Bell className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">Reminders</h4>
              <p className="text-xs text-gray-600">Never miss an appointment</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Shield className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-semibold text-sm mb-1">Secure & Private</h4>
              <p className="text-xs text-gray-600">HIPAA compliant platform</p>
            </div>
          </div>
        </div>
      ),
    },

    // Step 1: Personal Information
    {
      title: "Personal Information",
      description: "Help us get to know you better",
      icon: Users,
      content: (
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={data.firstName}
                onChange={(e) => updateData("firstName", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={data.lastName}
                onChange={(e) => updateData("lastName", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => updateData("dateOfBirth", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={data.phone}
              onChange={(e) => updateData("phone", e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mt-4">
            <p className="text-xs text-blue-900">
              🔒 Your information is encrypted and HIPAA compliant
            </p>
          </div>
        </div>
      ),
    },

    // Step 2: Medical History
    {
      title: "Medical History",
      description: "Help us provide better care",
      icon: Heart,
      content: (
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600 mb-4">
            This information helps us provide safer, more personalized care.
          </p>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="hasAllergies"
                  checked={data.hasAllergies}
                  onCheckedChange={(checked) => updateData("hasAllergies", checked)}
                />
                <Label htmlFor="hasAllergies" className="font-semibold">
                  I have allergies
                </Label>
              </div>
              {data.hasAllergies && (
                <Input
                  placeholder="List your allergies (e.g., penicillin, latex)"
                  value={data.allergies}
                  onChange={(e) => updateData("allergies", e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="hasMedications"
                  checked={data.hasMedications}
                  onCheckedChange={(checked) => updateData("hasMedications", checked)}
                />
                <Label htmlFor="hasMedications" className="font-semibold">
                  I take medications
                </Label>
              </div>
              {data.hasMedications && (
                <Input
                  placeholder="List your current medications"
                  value={data.medications}
                  onChange={(e) => updateData("medications", e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="hasConditions"
                  checked={data.hasConditions}
                  onCheckedChange={(checked) => updateData("hasConditions", checked)}
                />
                <Label htmlFor="hasConditions" className="font-semibold">
                  I have medical conditions
                </Label>
              </div>
              {data.hasConditions && (
                <Input
                  placeholder="List any medical conditions (e.g., diabetes, heart disease)"
                  value={data.conditions}
                  onChange={(e) => updateData("conditions", e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg mt-4">
            <p className="text-xs text-green-900">
              💡 You can skip this step and add details later in your profile
            </p>
          </div>
        </div>
      ),
    },

    // Step 3: Dental History
    {
      title: "Dental History",
      description: "Tell us about your dental care",
      icon: Calendar,
      content: (
        <div className="space-y-4 py-4">
          <div>
            <Label>When was your last dental visit?</Label>
            <Select value={data.lastDentalVisit} onValueChange={(value) => updateData("lastDentalVisit", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="less-than-6-months">Less than 6 months ago</SelectItem>
                <SelectItem value="6-12-months">6-12 months ago</SelectItem>
                <SelectItem value="1-2-years">1-2 years ago</SelectItem>
                <SelectItem value="more-than-2-years">More than 2 years ago</SelectItem>
                <SelectItem value="never">I've never been to a dentist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-3 block">Any current dental concerns? (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Tooth Pain",
                "Bleeding Gums",
                "Sensitivity",
                "Cavities",
                "Whitening",
                "Crooked Teeth",
                "Missing Teeth",
                "Bad Breath",
                "Regular Checkup",
                "None",
              ].map((concern) => (
                <button
                  key={concern}
                  type="button"
                  onClick={() => toggleConcern(concern)}
                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                    data.dentalConcerns.includes(concern)
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // Step 4: Preferences
    {
      title: "Your Preferences",
      description: "Customize your experience",
      icon: Clock,
      content: (
        <div className="space-y-4 py-4">
          <div>
            <Label>Preferred appointment time</Label>
            <Select
              value={data.preferredAppointmentTime}
              onValueChange={(value) => updateData("preferredAppointmentTime", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                <SelectItem value="no-preference">No preference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>How would you like to receive appointment reminders?</Label>
            <Select
              value={data.communicationPreference}
              onValueChange={(value) => updateData("communicationPreference", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">Text Message (SMS)</SelectItem>
                <SelectItem value="both">Both Email & SMS</SelectItem>
                <SelectItem value="none">No reminders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-sm mb-2 text-purple-900">🎉 Almost done!</h4>
            <p className="text-xs text-purple-900">
              Just one more step to complete your profile and start booking appointments.
            </p>
          </div>
        </div>
      ),
    },

    // Step 5: Terms & Completion
    {
      title: "Terms & Privacy",
      description: "Please review and accept",
      icon: Shield,
      content: (
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptedTerms"
                checked={data.acceptedTerms}
                onCheckedChange={(checked) => updateData("acceptedTerms", checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="acceptedTerms" className="cursor-pointer">
                  I accept the <a href="/terms" className="text-blue-600 underline" target="_blank">Terms of Service</a>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptedPrivacy"
                checked={data.acceptedPrivacy}
                onCheckedChange={(checked) => updateData("acceptedPrivacy", checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="acceptedPrivacy" className="cursor-pointer">
                  I accept the <a href="/privacy" className="text-blue-600 underline" target="_blank">Privacy Policy</a>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptedHIPAA"
                checked={data.acceptedHIPAA}
                onCheckedChange={(checked) => updateData("acceptedHIPAA", checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="acceptedHIPAA" className="cursor-pointer">
                  I consent to the collection and use of my health information in accordance with HIPAA regulations
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200 mt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-blue-900">You're all set!</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Your patient profile is ready. You can now:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Book appointments online 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Chat with our AI dental assistant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    View your treatment history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Manage your family's dental care
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.firstName && data.lastName && data.dateOfBirth && data.phone;
      case 5:
        return data.acceptedTerms && data.acceptedPrivacy && data.acceptedHIPAA;
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle>{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="mt-4">
          {currentStepData.content}
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
          >
            {loading ? (
              "Saving..."
            ) : currentStep === totalSteps - 1 ? (
              <>
                Complete Setup
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
