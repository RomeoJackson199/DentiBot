import { useState, useEffect } from 'react';
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

  // Load existing clinic data if user already has one
  useEffect(() => {
    const loadExistingClinic = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, dentists(*, clinic_settings(*))')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.dentists?.[0]) return;

        const dentist = profile.dentists[0];
        const clinic = dentist.clinic_settings?.[0];

        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          clinicName: clinic?.clinic_name || '',
          specialtyType: clinic?.specialty_type || dentist.specialization || 'dentist',
          address: dentist.clinic_address || '',
          phone: profile.phone || '',
          businessSlug: clinic?.business_slug || '',
          tagline: clinic?.tagline || '',
          primaryColor: clinic?.primary_color || '#0F3D91',
          secondaryColor: clinic?.secondary_color || '#66D2D6',
        }));

        // If clinic exists but missing business slug, skip to that step
        if (clinic && !clinic.business_slug) {
          setCurrentStep(2);
          toast.info('Please complete your business URL setup');
        }
      } catch (error) {
        console.error('Error loading clinic:', error);
      }
    };

    loadExistingClinic();
  }, []);

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
      // Get current user's clinic to allow their own slug
      const { data: { user } } = await supabase.auth.getUser();
      let currentClinicSlug: string | null = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('dentists(clinic_settings(business_slug))')
          .eq('user_id', user.id)
          .maybeSingle();
        
        currentClinicSlug = profile?.dentists?.[0]?.clinic_settings?.[0]?.business_slug;
      }

      // Check if slug exists
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

      // Slug is available if: no data found OR it's the user's own slug
      setSlugAvailable(!data || data.business_slug === currentClinicSlug);
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
      // 1. Check if user already exists
      const { data: existingSession } = await supabase.auth.getSession();
      let userId: string;
      
      if (existingSession?.session?.user) {
        // User is already logged in
        userId = existingSession.session.user.id;
      } else {
        // Try to sign up
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

        // If user already exists, try signing in
        if (authError?.message?.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          
          if (signInError) throw signInError;
          if (!signInData.user) throw new Error('Sign in failed');
          userId = signInData.user.id;
        } else {
          if (authError) throw authError;
          if (!authData.user) throw new Error('User creation failed');
          userId = authData.user.id;
          // Ensure session exists (if email confirmation disabled)
          let sessionAttempts = 0;
          while (sessionAttempts < 5) {
            const { data: sess } = await supabase.auth.getSession();
            if (sess?.session) break;
            // Try password sign-in once if no session yet
            if (sessionAttempts === 1) {
              const { error: pwErr } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
              if (pwErr && /email/i.test(pwErr.message) && /confirm/i.test(pwErr.message)) {
                throw new Error('Please confirm your email to continue, then return to create your clinic.');
              }
            }
            await new Promise(r => setTimeout(r, 400));
            sessionAttempts++;
          }
        }
      }

      // 2. Get profile with retries (via RPC to bypass RLS)
      let profileId: string | null = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!profileId && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 400 * (attempts + 1)));
        
        const { data: profId, error: profErr } = await supabase.rpc('get_current_user_profile_id');

        if (profErr) {
          attempts++;
          continue;
        }

        if (profId) {
          profileId = String(profId);
          break;
        }
        
        attempts++;
      }

      if (!profileId) {
        throw new Error('Unable to access profile. Please confirm your email or sign in, then retry.');
      }

      // 3. Get or create dentist record
      let dentist;
      const { data: existingDentist } = await supabase
        .from('dentists')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existingDentist) {
        // Update existing dentist
        const { data: updated, error: updateError } = await supabase
          .from('dentists')
          .update({
            is_active: true,
            specialization: formData.specialtyType,
            clinic_address: formData.address
          })
          .eq('id', existingDentist.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        dentist = updated;
      } else {
        // Create new dentist
        const { data: newDentist, error: dentistError } = await supabase
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
        dentist = newDentist;
      }

      // 4. Get or create clinic settings with business slug
      const { data: existingClinic } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('dentist_id', dentist.id)
        .maybeSingle();

      if (existingClinic) {
        // Update existing clinic settings
        const { error: updateError } = await supabase
          .from('clinic_settings')
          .update({
            clinic_name: formData.clinicName,
            business_slug: formData.businessSlug,
            tagline: formData.tagline,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            specialty_type: formData.specialtyType
          })
          .eq('id', existingClinic.id);

        if (updateError) throw updateError;
      } else {
        // Create new clinic settings
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
      }

      // 5. Ensure user is registered as dentist with proper role
      const { error: ensureError } = await supabase.rpc('ensure_current_user_is_dentist');
      if (ensureError) {
        console.warn('Failed to ensure dentist status:', ensureError.message);
      }

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