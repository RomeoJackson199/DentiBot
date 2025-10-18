import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { useRef } from 'react';

const STEPS = ['Account', 'Clinic Info', 'Business URL', 'Branding'];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    clinicName: '',
    specialtyType: 'dentist',
    address: '',
    phone: '',
    businessSlug: '',
    tagline: '',
    primaryColor: '#0F3D91',
    secondaryColor: '#66D2D6',
  });

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugAvailable(false);
      return;
    }

    setCheckingSlug(true);
    try {
      // Direct database check as fallback
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('business_slug')
        .eq('business_slug', slug.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking slug:', error);
        setSlugAvailable(null);
        return;
      }

      setSlugAvailable(!data);
    } catch (error: any) {
      console.error('Error checking slug:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, businessSlug: cleanSlug });
    
    // Clear previous timeout
    if (slugTimeoutRef.current) {
      clearTimeout(slugTimeoutRef.current);
    }
    
    // Set new timeout
    slugTimeoutRef.current = setTimeout(() => {
      checkSlugAvailability(cleanSlug);
    }, 500);
  };

  const handleSubmit = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'dentist'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Wait for trigger to create profile (with retry)
      let profileId: string | null = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!profileId && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempts + 1)));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          attempts++;
          continue;
        }

        if (profile?.id) {
          profileId = profile.id;
          break;
        }
        
        attempts++;
      }

      if (!profileId) {
        throw new Error('Profile creation timeout. Please try logging in.');
      }

      // 3. Create dentist record
      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .insert({
          profile_id: profileId,
          is_active: true,
          specialization: formData.specialtyType,
          clinic_address: formData.address
        })
        .select()
        .single();

      if (dentistError) throw dentistError;

      // 4. Create clinic settings with business slug
      const { error: clinicError } = await supabase
        .from('clinic_settings')
        .insert({
          dentist_id: dentist.id,
          clinic_name: formData.clinicName,
          business_slug: formData.businessSlug,
          tagline: formData.tagline,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          specialty_type: formData.specialtyType
        });

      if (clinicError) throw clinicError;

      toast.success('Clinic created successfully!');
      
      // Redirect to dentist portal
      setTimeout(() => {
        navigate('/dentist/clinical/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      toast.error(error.message || 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.email && formData.password && formData.firstName && formData.lastName;
      case 1:
        return formData.clinicName && formData.address && formData.phone;
      case 2:
        return formData.businessSlug && slugAvailable;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Your Dental Practice</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessSlug">Your Clinic URL</Label>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">yourapp.com/</span>
                  <Input
                    id="businessSlug"
                    value={formData.businessSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="drsmith-dental"
                    className="flex-1"
                  />
                  {checkingSlug && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!checkingSlug && slugAvailable === true && <Check className="h-4 w-4 text-green-600" />}
                  {!checkingSlug && slugAvailable === false && <span className="text-xs text-destructive">Taken</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be your unique clinic URL that patients use to book appointments
                </p>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline (Optional)</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Your smile, our priority"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep === STEPS.length - 1 ? 'Create Clinic' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}