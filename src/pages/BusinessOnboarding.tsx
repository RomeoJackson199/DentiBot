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
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', formData.email)
        .maybeSingle();

      let userId: string;
      
      if (existingUser) {
        // User exists, sign them in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          throw new Error('This email is already registered. Please use the correct password or use a different email.');
        }
        
        if (!signInData.user) throw new Error('Failed to sign in');
        userId = signInData.user.id;
      } else {
        // Create new user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'dentist'
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) {
          throw new Error('Signup failed. The email may already be registered. Please try signing in instead.');
        }
        userId = authData.user.id;

        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Get the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Please verify your email from the confirmation link, then return here and try again.');

      // If not authenticated yet (email confirmation required), stop here with guidance
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.info('Please confirm your email to continue. Then return here and click Create again.');
        return;
      }

      // Update profile with phone
      if (formData.phone) {
        await supabase
          .from('profiles')
          .update({ phone: formData.phone })
          .eq('id', profile.id);
      }
      // Ensure dentist record exists
      const { data: existingDentist, error: existingDentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (existingDentistError) throw existingDentistError;

      let dentistId: string;
      if (existingDentist) {
        dentistId = existingDentist.id;
      } else {
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .insert({
            profile_id: profile.id,
            is_active: true
          })
          .select()
          .maybeSingle();

        if (dentistError) throw dentistError;
        if (!dentist) throw new Error('Failed to create dentist record.');
        dentistId = dentist.id;
      }


      // Get specialty template
      const template = getSpecialtyTemplate(formData.specialtyType);

      // Create clinic settings with branding
      const { error: settingsError } = await supabase
        .from('clinic_settings')
        .insert({
          dentist_id: dentistId,
          clinic_name: businessSlug,
          specialty_type: formData.specialtyType,
          primary_color: template.primaryColor,
          secondary_color: template.secondaryColor,
          ai_instructions: template.aiInstructions,
          ai_tone: template.aiTone,
          welcome_message: template.welcomeMessage,
          appointment_keywords: template.appointmentKeywords,
          emergency_keywords: template.emergencyKeywords
        });

      if (settingsError) throw settingsError;

      toast.success(`Welcome to your ${template.name} practice portal!`);
      navigate('/dentist/clinical/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to create account');
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
