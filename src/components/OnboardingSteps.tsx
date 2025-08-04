import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, Phone, MapPin, Heart, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProfileData, ProfileData } from '@/lib/profileUtils';

interface OnboardingStepsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const OnboardingSteps = ({ isOpen, onClose, user }: OnboardingStepsProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: user.user_metadata?.first_name || '',
    last_name: user.user_metadata?.last_name || '',
    phone: user.user_metadata?.phone || '',
    date_of_birth: '',
    medical_history: '',
    address: '',
    emergency_contact: '',
    ai_opt_out: false,
  });

  const steps = [
    {
      title: "Welcome to DentiBot!",
      subtitle: "Let's set up your profile step by step",
      icon: <UserIcon className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            We need a few details to personalize your dental care experience. This will only take a minute!
          </p>
        </div>
      )
    },
    {
      title: "Personal Information",
      subtitle: "Tell us about yourself",
      icon: <UserIcon className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profileData.first_name}
                onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profileData.last_name}
                onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profileData.date_of_birth}
              onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
              required
            />
          </div>
        </div>
      )
    },
    {
      title: "Contact Information",
      subtitle: "How can we reach you?",
      icon: <Phone className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={profileData.address}
              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
              placeholder="Your home address"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={profileData.emergency_contact}
              onChange={(e) => setProfileData({...profileData, emergency_contact: e.target.value})}
              placeholder="Name and phone number"
            />
          </div>
        </div>
      )
    },
    {
      title: "Medical History",
      subtitle: "Help us provide better care",
      icon: <Heart className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="medical_history">Medical History & Allergies</Label>
            <Textarea
              id="medical_history"
              value={profileData.medical_history}
              onChange={(e) => setProfileData({...profileData, medical_history: e.target.value})}
              placeholder="Please list any medical conditions, allergies, medications you're taking, or previous dental treatments..."
              rows={5}
            />
          </div>
          <p className="text-sm text-gray-500">
            This information helps your dentist provide safer and more effective treatment.
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await saveProfileData(user, profileData);
      toast({
        title: "Profile completed!",
        description: "Your information has been saved successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return profileData.first_name && profileData.last_name && profileData.date_of_birth;
      case 2:
        return true; // Contact info is optional
      case 3:
        return true; // Medical history is optional
      default:
        return false;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {steps[currentStep].icon}
            <div>
              <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-600 font-normal">{steps[currentStep].subtitle}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="min-h-[300px]">
            {steps[currentStep].content}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? "Saving..." : currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};