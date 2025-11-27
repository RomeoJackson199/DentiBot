import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateBusinessForUser } from '@/hooks/useSuperAdmin';
import { Loader2 } from 'lucide-react';

interface CreateBusinessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateBusinessDialog({ open, onClose }: CreateBusinessDialogProps) {
  const createBusiness = useCreateBusinessForUser();
  const [formData, setFormData] = useState({
    business_name: '',
    owner_email: '',
    owner_first_name: '',
    owner_last_name: '',
    business_type: 'dental',
    template_type: 'default',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createBusiness.mutateAsync(formData);

    // Reset form and close
    setFormData({
      business_name: '',
      owner_email: '',
      owner_first_name: '',
      owner_last_name: '',
      business_type: 'dental',
      template_type: 'default',
    });
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Business for User</DialogTitle>
          <DialogDescription>
            Create a new business on behalf of a user. They will receive an invitation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              placeholder="e.g., Smith Dental Clinic"
              value={formData.business_name}
              onChange={(e) => handleChange('business_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_first_name">Owner First Name *</Label>
              <Input
                id="owner_first_name"
                placeholder="John"
                value={formData.owner_first_name}
                onChange={(e) => handleChange('owner_first_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_last_name">Owner Last Name *</Label>
              <Input
                id="owner_last_name"
                placeholder="Smith"
                value={formData.owner_last_name}
                onChange={(e) => handleChange('owner_last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_email">Owner Email *</Label>
            <Input
              id="owner_email"
              type="email"
              placeholder="john.smith@example.com"
              value={formData.owner_email}
              onChange={(e) => handleChange('owner_email', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              An invitation will be sent to this email address
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => handleChange('business_type', value)}
              >
                <SelectTrigger id="business_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_type">Template</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value) => handleChange('template_type', value)}
              >
                <SelectTrigger id="template_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createBusiness.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBusiness.isPending}>
              {createBusiness.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
