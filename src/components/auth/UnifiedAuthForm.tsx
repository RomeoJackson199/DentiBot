import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Lock, User, Phone, LogIn } from "lucide-react";
import { AccountClaimFlow } from "@/components/AccountClaimFlow";

interface UnifiedAuthFormProps {
  compact?: boolean;
  onSignInSuccess?: () => void;
}

export const UnifiedAuthForm = ({ compact = false, onSignInSuccess }: UnifiedAuthFormProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showClaimFlow, setShowClaimFlow] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("signin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const { toast } = useToast();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const checkExistingProfile = async (email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .is('user_id', null)
      .single();
    
    if (data && !error) {
      return data;
    }
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: t.signInSuccess,
        description: t.welcomeToDentiBot,
      });
      
      if (compact) {
        setShowLoginDialog(false);
      }
      
      onSignInSuccess?.();
    } catch (error: unknown) {
      toast({
        title: t.signInError,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if this email already exists in profiles (imported user)
      const existingProfile = await checkExistingProfile(formData.email);
      if (existingProfile) {
        setExistingProfile(existingProfile);
        setShowClaimFlow(true);
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            health_data_consent: true,
            health_data_consent_at: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: t.accountCreatedSuccess,
          description: t.checkEmailConfirm,
          duration: 10000,
        });
        
        // Show additional alert for email confirmation
        toast({
          title: "📧 Check Your Email",
          description: "We sent you a confirmation link. Please check your inbox (and spam folder) to activate your account.",
          duration: 15000,
        });
        
        if (compact) {
          setShowLoginDialog(false);
        }
      }
    } catch (error: unknown) {
      toast({
        title: t.signUpError,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStandardLogin = useCallback(() => {
    setShowClaimFlow(false);
    setExistingProfile(null);
    setActiveTab("signin");
    // Ensure we're back to the main auth form
    if (compact) {
      setShowLoginDialog(true);
    }
  }, [compact]);

  // Compact mode rendering
  if (compact) {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setShowLoginDialog(true)}
          className="glass-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 min-h-[44px]"
          aria-label="Sign in to your account"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {t.signIn}
        </Button>
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="max-w-md" data-modal-open="true">
            <DialogHeader>
              <DialogTitle>{t.accessDentiBot}</DialogTitle>
            </DialogHeader>
            <UnifiedAuthForm onSignInSuccess={() => setShowLoginDialog(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show claim flow if existing profile found
  if (showClaimFlow && existingProfile) {
    return (
      <AccountClaimFlow
        email={formData.email}
        existingProfile={existingProfile}
        onBack={handleBackToStandardLogin}
        onSuccess={() => {
          setShowClaimFlow(false);
          setExistingProfile(null);
          onSignInSuccess?.();
        }}
      />
    );
  }

  // Main auth form
  return (
    <div className="w-full">
      <Card className="shadow-elegant glass-card border border-border/20">
        <CardHeader className="text-center">
          <CardTitle>{t.accessDentiBot}</CardTitle>
          <CardDescription>
            {t.signInOrCreate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                {t.signIn}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
              >
                {t.signUp}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder={t.enterEmail}
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder={t.enterPassword}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px]" 
                  disabled={isLoading}
                  aria-label="Sign in to your account"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.signInButton}
                </Button>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowClaimFlow(true)}
                    className="text-sm text-dental-primary underline p-0 h-auto min-h-[44px]"
                    aria-label="Check if you're already registered at this clinic"
                  >
                    Check if I'm registered at this clinic
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstName">{t.firstName}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-firstName"
                        name="firstName"
                        placeholder={t.firstName}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                        autoComplete="given-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-lastName">{t.lastName}</Label>
                    <Input
                      id="signup-lastName"
                      name="lastName"
                      placeholder={t.lastName}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder={t.enterEmail}
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder={t.enterPassword}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">{t.phone} ({t.optional})</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="+32 XXX XX XX XX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px]" 
                  disabled={isLoading}
                  aria-label="Create your account"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.signUp}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};