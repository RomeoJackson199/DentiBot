import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BusinessDetailsStepProps {
  businessData: {
    name?: string;
    tagline?: string;
    bio?: string;
  };
  onUpdate: (data: any) => void;
}

export function BusinessDetailsStep({ businessData, onUpdate }: BusinessDetailsStepProps) {
  const [name, setName] = useState(businessData.name || '');
  const [tagline, setTagline] = useState(businessData.tagline || '');
  const [bio, setBio] = useState(businessData.bio || '');

  const handleChange = (field: string, value: string) => {
    const updates: any = { [field]: value };
    if (field === 'name') setName(value);
    if (field === 'tagline') setTagline(value);
    if (field === 'bio') setBio(value);
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Business Details</h2>
        <p className="text-muted-foreground mt-2">
          Tell us about your business
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            value={name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="A short description of your business"
            value={tagline}
            onChange={(e) => handleChange('tagline', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">About Your Business</Label>
          <Textarea
            id="bio"
            placeholder="Tell customers about your business, services, and what makes you unique..."
            value={bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={6}
          />
        </div>
      </div>
    </div>
  );
}
