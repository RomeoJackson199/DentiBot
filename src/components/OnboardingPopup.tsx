import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Camera, MessageSquare, Users, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingPopup = ({ isOpen, onClose }: OnboardingPopupProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t.welcomeToFirstSmile,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4">
              <div className="pulse-ring w-20 h-20 -top-5 -left-5"></div>
              <div className="relative bg-gradient-primary p-4 rounded-2xl shadow-glow">
                <Activity className="h-12 w-12 text-white mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold gradient-text mb-2">{t.yourAIDentalAssistant}</h3>
            <p className="text-dental-muted-foreground">
              {t.onboardingIntro}
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Smart Features at Your Service",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="floating-card p-4 text-center">
            <MessageSquare className="h-8 w-8 text-dental-primary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">AI Chat</h4>
            <p className="text-xs text-dental-muted-foreground">Get instant answers to dental questions</p>
          </div>
          <div className="floating-card p-4 text-center">
            <Calendar className="h-8 w-8 text-dental-secondary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Smart Booking</h4>
            <p className="text-xs text-dental-muted-foreground">Book appointments intelligently</p>
          </div>
          <div className="floating-card p-4 text-center">
            <Camera className="h-8 w-8 text-dental-accent mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Photo Analysis</h4>
            <p className="text-xs text-dental-muted-foreground">Upload photos for AI analysis</p>
          </div>
          <div className="floating-card p-4 text-center">
            <Users className="h-8 w-8 text-dental-primary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Family Care</h4>
            <p className="text-xs text-dental-muted-foreground">Book for family members too</p>
          </div>
        </div>
      )
    },
    {
      title: "Book for Anyone in Your Family",
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Users className="h-16 w-16 text-dental-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Family-Friendly Booking</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 floating-card">
              <CheckCircle className="h-5 w-5 text-dental-secondary" />
              <span className="text-sm">Book appointments for yourself</span>
            </div>
            <div className="flex items-center gap-3 p-3 floating-card">
              <CheckCircle className="h-5 w-5 text-dental-secondary" />
              <span className="text-sm">Book for your children</span>
            </div>
            <div className="flex items-center gap-3 p-3 floating-card">
              <CheckCircle className="h-5 w-5 text-dental-secondary" />
              <span className="text-sm">Book for family members</span>
            </div>
          </div>
          <Badge variant="outline" className="w-full justify-center py-2 border-dental-primary/30 text-dental-primary">
            <Clock className="h-4 w-4 mr-2" />
            I'll always tell you appointment duration and end time
          </Badge>
        </div>
      )
    },
    {
      title: "Ready to Get Started?",
      content: (
        <div className="text-center space-y-4">
          <div className="relative mx-auto">
            <div className="bg-gradient-primary p-6 rounded-3xl shadow-glow animate-glow">
              <MessageSquare className="h-16 w-16 text-white mx-auto" />
            </div>
          </div>
          <h3 className="text-xl font-semibold gradient-text">You're All Set! 🎉</h3>
          <p className="text-dental-muted-foreground">
            Start chatting with me below to book appointments, ask questions, or get dental advice.
          </p>
          <div className="bg-dental-primary/10 p-4 rounded-xl">
            <p className="text-sm font-medium text-dental-primary">
              💡 Pro Tip: Just tell me what's bothering you, and I'll guide you through everything!
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-card border-dental-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center">
            {steps[currentStep].title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {steps[currentStep].content}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-dental-primary w-6' 
                    : index < currentStep 
                      ? 'bg-dental-secondary' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={nextStep}
              className="bg-gradient-primary text-white hover:shadow-glow"
            >
              {currentStep === steps.length - 1 ? "Let's Start!" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};