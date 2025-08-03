import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Lock, User, Phone, LogIn, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface ProgressiveAuthFormProps {
  compact?: boolean;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ValidationStep {
  field: keyof FormData;
  label: string;
  placeholder: string;
  type: string;
  required: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export const ProgressiveAuthForm = ({ compact = false }: ProgressiveAuthFormProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const signInSteps: ValidationStep[] = [
    {
      field: 'email',
      label: t.email,
      placeholder: t.enterEmail,
      type: 'email',
      required: true,
      icon: Mail
    },
    {
      field: 'password',
      label: t.password,
      placeholder: t.enterPassword,
      type: 'password',
      required: true,
      icon: Lock
    }
  ];

  const signUpSteps: ValidationStep[] = [
    {
      field: 'firstName',
      label: t.firstName,
      placeholder: t.enterFirstName,
      type: 'text',
      required: true,
      icon: User
    },
    {
      field: 'lastName',
      label: t.lastName,
      placeholder: t.enterLastName,
      type: 'text',
      required: true,
      icon: User
    },
    {
      field: 'email',
      label: t.email,
      placeholder: t.enterEmail,
      type: 'email',
      required: true,
      icon: Mail
    },
    {
      field: 'password',
      label: t.password,
      placeholder: t.enterPassword,
      type: 'password',
      required: true,
      icon: Lock
    },
    {
      field: 'phone',
      label: t.phone,
      placeholder: t.enterPhoneNumber,
      type: 'tel',
      required: false,
      icon: Phone
    }
  ];

  const currentSteps = isSignUp ? signUpSteps : signInSteps;
  const currentField = currentSteps[currentStep]?.field;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateCurrentStep = () => {
    const step = currentSteps[currentStep];
    if (!step) return true;
    
    const value = formData[step.field];
    if (step.required && !value.trim()) {
      return false;
    }
    
    if (step.field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return false;
      }
    }
    
    if (step.field === 'password' && value && value.length < 6) {
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < currentSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed, proceed with auth
        if (isSignUp) {
          handleSignUp();
        } else {
          handleSignIn();
        }
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignUp = async () => {
    if (!acceptTerms || !healthConsent) {
      toast({
        title: "Required",
        description: "Please accept the terms and health data consent",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
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
        });
        
        if (compact) {
          setShowLoginDialog(false);
        }
      }
    } catch (error: any) {
      toast({
        title: t.signUpError,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
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
    } catch (error: any) {
      toast({
        title: t.signInError,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Google sign-in...');
      const redirectUrl = `${window.location.origin}/`;
      console.log('Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
      console.log('Google sign-in initiated successfully');
    } catch (error: any) {
      console.error('Google sign-in catch block:', error);
      toast({
        title: t.signInError,
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
    setCurrentStep(0);
    setAcceptTerms(false);
    setHealthConsent(false);
  };

  const switchMode = (mode: 'signin' | 'signup') => {
    setIsSignUp(mode === 'signup');
    setCurrentStep(0);
    resetForm();
  };

  if (compact) {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setShowLoginDialog(true)}
          className="glass-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {t.signIn}
        </Button>
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.accessDentiBot}</DialogTitle>
            </DialogHeader>
            <ProgressiveAuthForm />
          </DialogContent>
        </Dialog>
      </>
    );
  }

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
          <Tabs defaultValue="signin" className="w-full" onValueChange={(value) => switchMode(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                {t.signIn}
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                {t.signUp}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full border-2 border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50 text-gray-700"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                  </div>
                </div>
                
                {/* Progressive Form for Sign In */}
                <div className="space-y-4">
                  {currentSteps.map((step, index) => (
                    <div key={step.field} className={`transition-all duration-300 ${index === currentStep ? 'block' : 'hidden'}`}>
                      <Label htmlFor={`signin-${step.field}`}>{step.label}</Label>
                      <div className="relative">
                        <step.icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`signin-${step.field}`}
                          name={step.field}
                          type={step.type}
                          placeholder={step.placeholder}
                          value={formData[step.field]}
                          onChange={handleInputChange}
                          className="pl-10"
                          required={step.required}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNextStep();
                            }
                          }}
                        />
                      </div>
                      {index === currentStep && !validateCurrentStep() && formData[step.field] && (
                        <p className="text-sm text-red-500 mt-1">
                          {step.field === 'email' ? 'Please enter a valid email address' : 
                           step.field === 'password' ? 'Password must be at least 6 characters' : 
                           'This field is required'}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 pt-4">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousStep}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isLoading || !validateCurrentStep()}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : currentStep < currentSteps.length - 1 ? (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          {t.signInButton}
                          <CheckCircle className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full border-2 border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50 text-gray-700"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Sign up with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
                  </div>
                </div>
                
                {/* Progressive Form for Sign Up */}
                <div className="space-y-4">
                  {currentSteps.map((step, index) => (
                    <div key={step.field} className={`transition-all duration-300 ${index === currentStep ? 'block' : 'hidden'}`}>
                      <Label htmlFor={`signup-${step.field}`}>
                        {step.label} {!step.required && `(${t.optional})`}
                      </Label>
                      <div className="relative">
                        <step.icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`signup-${step.field}`}
                          name={step.field}
                          type={step.type}
                          placeholder={step.placeholder}
                          value={formData[step.field]}
                          onChange={handleInputChange}
                          className="pl-10"
                          required={step.required}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNextStep();
                            }
                          }}
                        />
                      </div>
                      {index === currentStep && !validateCurrentStep() && formData[step.field] && (
                        <p className="text-sm text-red-500 mt-1">
                          {step.field === 'email' ? 'Please enter a valid email address' : 
                           step.field === 'password' ? 'Password must be at least 6 characters' : 
                           'This field is required'}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {/* Terms and Conditions - shown on last step */}
                  {currentStep === currentSteps.length - 1 && (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="tos"
                          checked={acceptTerms}
                          onCheckedChange={(c) => setAcceptTerms(!!c)}
                        />
                        <label htmlFor="tos" className="text-sm">
                          {t.acceptTerms}
                        </label>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="health"
                          checked={healthConsent}
                          onCheckedChange={(c) => setHealthConsent(!!c)}
                        />
                        <label htmlFor="health" className="text-sm">
                          {t.consentHealthData}
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.childConsentNote}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-4">
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousStep}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isLoading || !validateCurrentStep() || (currentStep === currentSteps.length - 1 && (!acceptTerms || !healthConsent))}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : currentStep < currentSteps.length - 1 ? (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          {t.createAccountButton}
                          <CheckCircle className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};