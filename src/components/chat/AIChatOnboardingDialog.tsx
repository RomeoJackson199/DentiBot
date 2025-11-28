import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Image, 
  AlertCircle,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface AIChatOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  examples: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: Bot,
    title: 'AI Dental Assistant',
    description: 'I can help you with appointments, health questions, and more using natural conversation.',
    examples: [
      'Show my appointments',
      'Book an appointment',
      'I have a toothache'
    ]
  },
  {
    icon: Calendar,
    title: 'Appointment Management',
    description: 'Book, reschedule, or cancel appointments easily through chat.',
    examples: [
      'Find earliest available slot',
      'Reschedule my appointment',
      'Emergency booking'
    ]
  },
  {
    icon: Settings,
    title: 'Quick Settings',
    description: 'Change language, theme, and preferences directly in chat.',
    examples: [
      'Change language to French',
      'Switch to dark mode',
      'Update my information'
    ]
  },
  {
    icon: Image,
    title: 'Photo Sharing',
    description: 'Share dental images, X-rays, or photos for better assistance.',
    examples: [
      'Upload a photo',
      'Share my X-ray',
      'Take a picture'
    ]
  }
];

export const AIChatOnboardingDialog = ({ isOpen, onClose }: AIChatOnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Mark as seen and close
      localStorage.setItem('ai-chat-onboarding-seen', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('ai-chat-onboarding-seen', 'true');
    onClose();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Try saying:
          </div>
          
          <div className="space-y-2">
            {step.examples.map((example, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{example}</span>
              </div>
            ))}
          </div>

          {currentStep === 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <strong>Pro Tip:</strong> Just type naturally like you're texting a friend. 
                The AI understands context and conversational language!
              </div>
            </div>
          )}

          {currentStep === ONBOARDING_STEPS.length - 1 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900">
                You're all set! Start chatting below and I'll help you with anything you need.
              </div>
            </div>
          )}
        </div>

        {/* Progress indicators */}
        <div className="flex gap-2 justify-center mb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
                  : index < currentStep 
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
          >
            Skip Tutorial
          </Button>
          <Button onClick={handleNext}>
            {currentStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Start Chatting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
