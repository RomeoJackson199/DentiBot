import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Calendar,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: 'confirm' | 'cancel' | 'complete', reason?: string) => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onBulkAction,
  onClearSelection,
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      return;
    }
    onBulkAction('cancel', cancelReason);
    setCancelReason('');
    setShowCancelDialog(false);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              Choose an action to apply to all selected appointments:
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('confirm')}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm All
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('complete')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Complete All
            </Button>
            
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel {selectedCount} Appointments</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will cancel all {selectedCount} selected appointments. 
                    Please provide a reason for the cancellation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                  <Textarea
                    id="cancel-reason"
                    placeholder="e.g., Dentist unavailable, equipment maintenance..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="min-h-20"
                  />
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setCancelReason('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={!cancelReason.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancel Appointments
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};