import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BusinessPickerDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BusinessPickerDialog({ open, onOpenChange }: BusinessPickerDialogProps) {
  const { memberships, switchBusiness, loading, businessId } = useBusinessContext();
  const [selecting, setSelecting] = useState(false);

  const handleSelectBusiness = async (targetBusinessId: string) => {
    setSelecting(true);
    try {
      await switchBusiness(targetBusinessId);
      onOpenChange?.(false);
    } finally {
      setSelecting(false);
    }
  };

  if (memberships.length === 0 && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Business Access</DialogTitle>
            <DialogDescription>
              You don't have access to any business. Please contact your administrator.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Your Business
          </DialogTitle>
          <DialogDescription>
            Choose which business you want to work with. You can switch anytime.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {memberships
            .filter((m) => {
              const templateType = (m as any).business?.template_type;
              return !templateType || templateType === 'healthcare' || templateType === 'dentist';
            })
            .map((membership) => (
            <Card
              key={membership.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                businessId === membership.business_id
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelectBusiness(membership.business_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {membership.business?.name}
                      {businessId === membership.business_id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {membership.role}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={businessId === membership.business_id ? 'default' : 'outline'}
                    disabled={selecting || businessId === membership.business_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBusiness(membership.business_id);
                    }}
                  >
                    {businessId === membership.business_id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
