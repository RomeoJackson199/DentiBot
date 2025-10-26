import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Info } from 'lucide-react';

interface BusinessCreationTourProps {
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_CONTENT = {
  1: {
    title: 'Welcome! Create Your Account',
    description: 'First, create your account or sign in if you already have one. This will be your business admin account.',
    tips: [
      'Use a professional email address',
      'Choose a secure password',
      'You\'ll need to verify your email',
    ],
  },
  2: {
    title: 'Choose Your Business Template',
    description: 'Select a template that matches your business type. Each template comes with pre-configured features and terminology.',
    tips: [
      'Templates customize the platform for your industry',
      'You can preview each template before selecting',
      'Choose "Custom" if you need specific features',
    ],
  },
  3: {
    title: 'Tell Us About Your Business',
    description: 'Add your business details. This information will be visible to your customers.',
    tips: [
      'Choose a clear, memorable business name',
      'Write a compelling tagline (optional)',
      'Describe what makes your business unique',
    ],
  },
  4: {
    title: 'Add Your Services',
    description: 'Define the services you offer, their prices, and duration. You can always add more later.',
    tips: [
      'Use quick-add buttons for common services',
      'Set realistic durations for scheduling',
      'You can edit prices anytime',
    ],
  },
  5: {
    title: 'Complete Setup with Payment',
    description: 'A one-time $0.50 activation fee unlocks your full business account with unlimited features.',
    tips: [
      'Secure payment via Stripe',
      'Instant activation after payment',
      'Get access to all platform features',
    ],
  },
};

export function BusinessCreationTour({ currentStep, isOpen, onClose }: BusinessCreationTourProps) {
  const content = TOUR_CONTENT[currentStep as keyof typeof TOUR_CONTENT];

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle>{content.title}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">Tips:</p>
            <ul className="space-y-1">
              {content.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
