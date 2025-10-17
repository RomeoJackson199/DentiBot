import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { getSpecialtyList, getSpecialtyTemplate } from '@/lib/specialtyTemplates';
import { useLanguage } from '@/hooks/useLanguage';

export default function BusinessOnboarding() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialtyType: 'dentist',
    phone: ''
  });

  const specialtyList = getSpecialtyList();

  useEffect(() => {
    checkAvailability();
  }, [businessSlug]);

  const checkAvailability = async () => {
    if (!businessSlug) {
      setChecking(false);
      return;
    }

    try {
      // Check if clinic with this slug already exists
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('id')
        .ilike('clinic_name', businessSlug)
        .maybeSingle();

      if (error) throw error;
      
      setAvailable(!data);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Error checking availability');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const template = getSpecialtyTemplate(formData.specialtyType);

      const { error } = await supabase.functions.invoke('business-onboard', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          businessSlug,
          specialtyType: formData.specialtyType,
          template: {
            primaryColor: template.primaryColor,
            secondaryColor: template.secondaryColor,
            aiInstructions: template.aiInstructions,
            aiTone: template.aiTone,
            welcomeMessage: template.welcomeMessage,
            appointmentKeywords: template.appointmentKeywords,
            emergencyKeywords: template.emergencyKeywords,
          },
        },
      });

      if (error) {
        const msg = (error as any)?.message || 'Failed to create practice';
        throw new Error(msg);
      }

      // Sign in immediately (user is created confirmed by the function)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (signInError) throw signInError;

      toast.success(`Welcome to your ${template.name} practice portal!`);
      navigate(`/${businessSlug}/dentist/clinical/dashboard`);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      if (error?.message === 'BUSINESS_NAME_TAKEN') {
        toast.error('This business name is already taken. Please choose another.');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <ModernLoadingSpinner variant="overlay" message="Checking availability..." />;
  }

  if (!available) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Business Name Unavailable</CardTitle>
            <CardDescription>
              The business name "{businessSlug}" is already taken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to {businessSlug}!</CardTitle>
          <CardDescription>
            Set up your practice in minutes. Choose your specialty and we'll customize everything for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">What field are you in?</Label>
              <Select
                value={formData.specialtyType}
                onValueChange={(value) => setFormData({ ...formData, specialtyType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialtyList.map((specialty) => (
                    <SelectItem key={specialty.value} value={specialty.value}>
                      <span className="flex items-center gap-2">
                        <span>{specialty.icon}</span>
                        <span>{specialty.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating Your Practice...' : 'Create My Practice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
