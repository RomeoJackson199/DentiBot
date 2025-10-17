import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daysLeft: number;
}

export const DemoConversionDialog: React.FC<DemoConversionDialogProps> = ({
  open,
  onOpenChange,
  daysLeft,
}) => {
  const navigate = useNavigate();

  const benefits = [
    'Remove demo mode restrictions',
    'Keep all your data and settings',
    'Unlimited bookings and users',
    'Priority customer support',
    'Custom branding options',
    'Advanced analytics and reports',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle>Upgrade Your Account</DialogTitle>
          </div>
          <DialogDescription>
            {daysLeft > 0 ? (
              <>You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your demo. Upgrade now to unlock all features!</>
            ) : (
              <>Your demo has expired. Upgrade now to continue using all features!</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-semibold mb-1">Your data is safe</p>
            <p className="text-sm text-muted-foreground">
              All your appointments, clients, and settings will be preserved when you upgrade.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={() => {
            navigate('/subscription');
            onOpenChange(false);
          }}>
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
