import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { businessOnboardingSchema } from "@/lib/validation";
import { getSpecialtyList, getSpecialtyTemplate } from "@/lib/specialtyTemplates";

export default function BusinessOnboarding() {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    specialtyType: "dentist"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const specialtyList = getSpecialtyList();

  const checkAvailability = async () => {
    if (!businessSlug) return;
    
    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('public-clinic-info', {
        body: { businessSlug }
      });

      if (error) throw error;
      
      setIsAvailable(!data?.exists);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check business name availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [businessSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = businessOnboardingSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the form errors');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const template = getSpecialtyTemplate(formData.specialtyType);

      const { data, error } = await supabase.functions.invoke('business-onboard', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
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
        }
      });

      if (error) {
        // Check for common errors and provide better messages
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          throw new Error('This email already has an account. Please try signing in.');
        }
        throw error;
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // Show success card
      setShowSuccess(true);
      
      // Auto-redirect after delay
      setTimeout(() => {
        navigate('/dentist/clinical/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to create business account');
    } finally {
      setLoading(false);
    }
  };

  const publicClinicUrl = `${window.location.origin}/${businessSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicClinicUrl);
    toast.success('Link copied to clipboard!');
  };

  if (checkingAvailability) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Checking availability...</span>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-center">Practice Created Successfully!</CardTitle>
            <CardDescription className="text-center">
              Your practice is now set up and ready to accept patients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Your Public Clinic Link</Label>
              <div className="flex items-center gap-2">
                <Input value={publicClinicUrl} readOnly className="flex-1" />
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => window.open(publicClinicUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this link with your patients so they can sign up and book appointments
              </p>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Redirecting to your dashboard in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Create Your Practice</CardTitle>
          <CardDescription>
            Set up your dental practice account for: <strong>{businessSlug}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAvailable ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Business Name Unavailable</h3>
              <p className="text-muted-foreground">
                The business name "{businessSlug}" is already taken. Please choose a different name.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">At least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialtyType">Specialty *</Label>
                <Select
                  value={formData.specialtyType}
                  onValueChange={(value) => setFormData({ ...formData, specialtyType: value })}
                >
                  <SelectTrigger aria-invalid={!!errors.specialtyType}>
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
                {errors.specialtyType && (
                  <p className="text-sm text-destructive">{errors.specialtyType}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Practice Account'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
