import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Building2,
  Dumbbell,
  Scissors,
  Stethoscope,
  Scale,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const industries = [
  { value: 'healthcare', label: 'Healthcare', icon: Stethoscope, description: 'Medical practices, clinics' },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell, description: 'Gyms, personal training' },
  { value: 'beauty', label: 'Beauty', icon: Scissors, description: 'Salons, spas' },
  { value: 'consulting', label: 'Consulting', icon: Briefcase, description: 'Professional services' },
  { value: 'legal', label: 'Legal', icon: Scale, description: 'Law firms, attorneys' },
  { value: 'education', label: 'Education', icon: GraduationCap, description: 'Tutoring, coaching' },
  { value: 'other', label: 'Other', icon: Building2, description: 'Other services' },
];

interface IndustrySelectionFlowProps {
  onComplete: () => void;
}

export const IndustrySelectionFlow: React.FC<IndustrySelectionFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'industry' | 'details'>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleIndustrySelect = () => {
    if (!selectedIndustry) {
      toast.error('Please select an industry');
      return;
    }
    setStep('details');
  };

  const handleComplete = async () => {
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('create-demo-organization', {
        body: {
          user_id: user.id,
          industry_type: selectedIndustry,
          business_name: businessName,
        },
      });

      if (error) throw error;

      toast.success(`Demo account created! Your business site: ${data.businessUrl}`);
      
      // Show business URL to user
      setTimeout(() => {
        toast.info(`Visit your public page at: ${window.location.origin}${data.businessUrl}`);
      }, 2000);
      
      onComplete();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating demo organization:', error);
      toast.error('Failed to create demo account: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {step === 'industry' ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome! Let's get started</CardTitle>
            <CardDescription>What type of business do you run?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <div className="grid gap-4 md:grid-cols-2">
                {industries.map((industry) => {
                  const Icon = industry.icon;
                  return (
                    <label
                      key={industry.value}
                      className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedIndustry === industry.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={industry.value} id={industry.value} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-5 w-5" />
                          <span className="font-semibold">{industry.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{industry.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
            <Button className="w-full mt-6" onClick={handleIndustrySelect}>
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your business</CardTitle>
            <CardDescription>
              We'll create a demo account with sample data so you can explore the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">What you'll get:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 14-day free demo with all features</li>
                <li>• Sample clients and appointments</li>
                <li>• Full access to scheduling and management tools</li>
                <li>• No credit card required</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('industry')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating Demo...' : 'Start Demo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
