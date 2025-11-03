import { useEffect, useCallback, useState } from 'react';
import { useBeforeUnload, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void;
}

export function useUnsavedChanges({ hasUnsavedChanges, onSave, onDiscard }: UseUnsavedChangesProps) {
  const [showDialog, setShowDialog] = useState(false);

  // Block browser navigation (refresh, close tab, etc.)
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          return (event.returnValue = '');
        }
      },
      [hasUnsavedChanges]
    )
  );

  const handleDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard();
    }
    setShowDialog(false);
  }, [onDiscard]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    setShowDialog(false);
  }, [onSave]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  const promptToSave = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDialog(true);
      return true;
    }
    return false;
  }, [hasUnsavedChanges]);

  const ConfirmationDialog = useCallback(() => (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Do you want to save them before leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Discard Changes
          </AlertDialogAction>
          {onSave && (
            <AlertDialogAction onClick={handleSave}>
              Save Changes
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [showDialog, handleCancel, handleDiscard, handleSave, onSave]);

  return { ConfirmationDialog, promptToSave };
}
