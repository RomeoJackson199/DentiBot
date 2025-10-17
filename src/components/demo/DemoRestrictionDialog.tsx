import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoRestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export const DemoRestrictionDialog: React.FC<DemoRestrictionDialogProps> = ({
  open,
  onOpenChange,
  feature,
}) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-amber-500" />
            <DialogTitle>Feature Limited in Demo Mode</DialogTitle>
          </div>
          <DialogDescription>
            {feature} is limited in demo mode. Upgrade to a paid plan to access this feature without restrictions.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm font-semibold mb-1">Upgrade Benefits:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Unlimited {feature.toLowerCase()}</li>
            <li>• Remove all demo restrictions</li>
            <li>• Priority support</li>
            <li>• Keep all your data</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue Demo
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
