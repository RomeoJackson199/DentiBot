import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle, AlertCircle, User } from "lucide-react";

export default function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    if (!token) {
      setError("Invalid invitation link");
      setIsLoading(false);
      return;
    }

    try {
      // Check if invitation token exists and is valid
      const { data, error } = await supabase
        .from('invitation_tokens')
        .select(`
          *,
          profiles:profile_id (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .eq('used', false)
        .single();

      if (error || !data) {
        setError("This invitation link is invalid or has expired");
        setIsLoading(false);
        return;
      }

      setInvitation(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error validating invitation:", error);
      setError("Failed to validate invitation");
      setIsLoading(false);
    }
  };

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSettingPassword(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.profiles.email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: invitation.profiles.first_name,
            last_name: invitation.profiles.last_name,
            phone: invitation.profiles.phone,
            health_data_consent: true,
            health_data_consent_at: new Date().toISOString(),
          },
        },
      });

      if (authError) throw authError;

      // Link the existing profile to the new auth user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_id: authData.user?.id })
        .eq('id', invitation.profiles.id);

      if (updateError) {
        console.error('Error linking profile:', updateError);
      }

      // Mark invitation as used
      const { error: tokenError } = await supabase
        .from('invitation_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('token', token);

      if (tokenError) {
        console.error('Error marking invitation as used:', tokenError);
      }

      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to verify your account, then you can sign in.",
      });

      // Redirect to home page after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      console.error('Error setting up account:', error);
      toast({
        title: "Error Setting Up Account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Welcome to DentiBot!</CardTitle>
          <CardDescription>
            Set up your password to access your dental records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">Your Account Details:</h4>
                <p className="text-sm text-muted-foreground">
                  Name: {invitation.profiles.first_name} {invitation.profiles.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: {invitation.profiles.email}
                </p>
                {invitation.profiles.phone && (
                  <p className="text-sm text-muted-foreground">
                    Phone: {invitation.profiles.phone}
                  </p>
                )}
              </div>

              <form onSubmit={handleSetupAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Create Your Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSettingPassword || !password || !confirmPassword || password !== confirmPassword}
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up your account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create My Account
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p>By creating your account, you agree to our terms of service and privacy policy.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}