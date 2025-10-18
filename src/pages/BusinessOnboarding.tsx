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

  // Load existing business data if user already has one
  useEffect(() => {
    const loadExistingBusiness = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) return;

        // Check if user owns any business
        const { data: businesses } = await supabase
          .from('businesses' as any)
          .select('*')
          .eq('owner_profile_id', profile.id)
          .maybeSingle();

        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          clinicName: businesses?.name || '',
          specialtyType: businesses?.specialty_type || 'dentist',
          phone: profile.phone || '',
          businessSlug: businesses?.slug || '',
          tagline: businesses?.tagline || '',
          primaryColor: businesses?.primary_color || '#0F3D91',
          secondaryColor: businesses?.secondary_color || '#66D2D6',
        }));

        // If business exists but missing slug, skip to that step
        if (businesses && !businesses.slug) {
          setCurrentStep(2);
          toast.info('Please complete your business URL setup');
        }
      } catch (error) {
        console.error('Error loading business:', error);
      }
    };

    loadExistingBusiness();
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
      // Get current user's business to allow their own slug
      const { data: { user } } = await supabase.auth.getUser();
      let currentBusinessSlug: string | null = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          const { data: business } = await supabase
            .from('businesses' as any)
            .select('slug')
            .eq('owner_profile_id', profile.id)
            .maybeSingle();
          
          currentBusinessSlug = business?.slug;
        }
      }

      // Check if slug exists in businesses table
      const { data, error } = await supabase
        .from('businesses' as any)
        .select('slug')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking slug:', error);
        setSlugAvailable(null);
        return;
      }

      // Slug is available if: no data found OR it's the user's own slug
      setSlugAvailable(!data || data.slug === currentBusinessSlug);
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

      // 2. Get profile (auto-created by trigger on signup)
      let profile = null;
      let attempts = 0;
      
      // Retry a few times in case profile creation is still processing
      while (!profile && attempts < 5) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          profile = data;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!profile) {
        throw new Error('Profile not found. Please try again.');
      }

      const profileId = profile.id;

      // Update profile with user-provided info
      await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone
        })
        .eq('id', profileId);

      // 3. Assign provider role (ignore if already exists)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'provider'
        });
      
      // Ignore duplicate key errors
      if (roleError && !roleError.message.includes('duplicate key')) {
        throw roleError;
      }

      // 4. Get or create business
      const { data: existingBusiness } = await supabase
        .from('businesses' as any)
        .select('id')
        .eq('owner_profile_id', profileId)
        .maybeSingle();

      let businessId: string;
      if (existingBusiness) {
        // Update existing business
        const { data: updated, error: updateError } = await supabase
          .from('businesses' as any)
          .update({
            name: formData.clinicName,
            slug: formData.businessSlug,
            tagline: formData.tagline || null,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            specialty_type: formData.specialtyType,
            business_hours: {},
            currency: 'USD',
            ai_tone: 'professional',
            ai_response_length: 'medium',
            appointment_keywords: ['appointment', 'booking', 'schedule'],
            emergency_keywords: ['emergency', 'urgent', 'pain'],
            show_logo_in_chat: true,
            show_branding_in_emails: true
          })
          .eq('id', existingBusiness.id)
          .select('id')
          .single();
        
        if (updateError) throw updateError;
        businessId = updated.id;
      } else {
        // Create new business
        const { data: newBusiness, error: businessError } = await supabase
          .from('businesses' as any)
          .insert({
            owner_profile_id: profileId,
            name: formData.clinicName,
            slug: formData.businessSlug,
            tagline: formData.tagline || null,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            specialty_type: formData.specialtyType,
            business_hours: {},
            currency: 'USD',
            ai_tone: 'professional',
            ai_response_length: 'medium',
            appointment_keywords: ['appointment', 'booking', 'schedule'],
            emergency_keywords: ['emergency', 'urgent', 'pain'],
            show_logo_in_chat: true,
            show_branding_in_emails: true
          })
          .select('id')
          .single();

        if (businessError) throw businessError;
        businessId = newBusiness.id;
      }

      // 5. Create provider record
      const { data: existingProvider } = await supabase
        .from('providers' as any)
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!existingProvider) {
        await supabase
          .from('providers' as any)
          .insert({
            profile_id: profileId,
            specialization: formData.specialtyType,
            is_active: true,
            average_rating: 0,
            total_ratings: 0,
            expertise_score: 0,
            communication_score: 0,
            wait_time_score: 0
          });
      }

      // 6. Link provider to business as owner (ignore if already linked)
      const { error: linkError } = await supabase
        .from('provider_business_map' as any)
        .insert({
          provider_id: profileId,
          business_id: businessId,
          role: 'owner'
        });
      
      // Ignore duplicate key errors
      if (linkError && !linkError.message.includes('duplicate key')) {
        throw linkError;
      }

      toast.success('Business created successfully!');
      
      // Redirect to business page
      setTimeout(() => {
        navigate(`/${formData.businessSlug}`);
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