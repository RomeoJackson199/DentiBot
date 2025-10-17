import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { patientOnboardingSchema, signInSchema } from "@/lib/validation";

interface ClinicInfo {
  clinic_name: string;
  tagline?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  specialty_type: string;
}

export default function PatientOnboarding() {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingClinic, setCheckingClinic] = useState(true);
  const [clinicExists, setClinicExists] = useState(false);
  const [clinicData, setClinicData] = useState<ClinicInfo | null>(null);
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: ""
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const checkClinic = async () => {
    if (!businessSlug) return;
    
    setCheckingClinic(true);
    try {
      const { data, error } = await supabase.functions.invoke('public-clinic-info', {
        body: { businessSlug }
      });

      if (error) throw error;
      
      if (data?.exists && data?.clinic) {
        setClinicExists(true);
        setClinicData(data.clinic);
      } else {
        setClinicExists(false);
      }
    } catch (error) {
      console.error('Error checking clinic:', error);
      toast.error('Failed to load clinic information');
    } finally {
      setCheckingClinic(false);
    }
  };

  useEffect(() => {
    checkClinic();
  }, [businessSlug]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = patientOnboardingSchema.safeParse(signUpData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setSignUpErrors(fieldErrors);
      toast.error('Please fix the form errors');
      return;
    }

    setSignUpErrors({});
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/${businessSlug}`;

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            role: 'patient'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw signUpError;
      }

      if (authData.user) {
        // Update the profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            phone: signUpData.phone || null,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        toast.success('Account created successfully! Welcome!');
        navigate('/care');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = signInSchema.safeParse(signInData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setSignInErrors(fieldErrors);
      toast.error('Please fix the form errors');
      return;
    }

    setSignInErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      toast.success('Signed in successfully! Welcome back!');
      navigate('/care');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      {checkingClinic ? (
        <div className="flex flex-col items-center gap-4">
          <ModernLoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading clinic information...</p>
        </div>
      ) : !clinicExists ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">Clinic Not Found</CardTitle>
            <CardDescription className="text-center">
              We couldn't find a clinic with the name "{businessSlug}". Please check the URL and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader 
            style={{
              borderTop: `4px solid ${clinicData?.primary_color}`,
            }}
          >
            {clinicData?.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={clinicData.logo_url} 
                  alt={clinicData.clinic_name} 
                  className="h-16 object-contain"
                />
              </div>
            )}
            <CardTitle 
              className="text-2xl text-center"
              style={{ color: clinicData?.primary_color }}
            >
              {clinicData?.clinic_name}
            </CardTitle>
            {clinicData?.tagline && (
              <CardDescription className="text-center">{clinicData.tagline}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email *</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      aria-invalid={!!signInErrors.email}
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-destructive">{signInErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password *</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      aria-invalid={!!signInErrors.password}
                    />
                    {signInErrors.password && (
                      <p className="text-sm text-destructive">{signInErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        aria-invalid={!!signUpErrors.firstName}
                      />
                      {signUpErrors.firstName && (
                        <p className="text-sm text-destructive">{signUpErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        aria-invalid={!!signUpErrors.lastName}
                      />
                      {signUpErrors.lastName && (
                        <p className="text-sm text-destructive">{signUpErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      aria-invalid={!!signUpErrors.email}
                    />
                    {signUpErrors.email && (
                      <p className="text-sm text-destructive">{signUpErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      aria-invalid={!!signUpErrors.password}
                    />
                    {signUpErrors.password && (
                      <p className="text-sm text-destructive">{signUpErrors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                      aria-invalid={!!signUpErrors.phone}
                    />
                    {signUpErrors.phone && (
                      <p className="text-sm text-destructive">{signUpErrors.phone}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
