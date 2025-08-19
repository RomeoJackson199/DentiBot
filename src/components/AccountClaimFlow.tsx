import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, User, CheckCircle, ArrowLeft } from "lucide-react";

interface AccountClaimFlowProps {
  email: string;
  existingProfile: any;
  onBack: () => void;
  onSuccess: () => void;
}

export const AccountClaimFlow = ({ email, existingProfile, onBack, onSuccess }: AccountClaimFlowProps) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClaimAccount = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: existingProfile.first_name,
            last_name: existingProfile.last_name,
            phone: existingProfile.phone,
            health_data_consent: true,
            health_data_consent_at: new Date().toISOString(),
            claim_existing_profile: existingProfile.id, // Flag to link to existing profile
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update the existing profile to link it to the new auth user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: data.user.id })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('Error linking profile:', updateError);
          // Don't throw here - the auth user was created successfully
        }

        toast({
          title: "Account Claimed Successfully!",
          description: "Your account has been linked. Please check your email to verify your address.",
        });
        onSuccess();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error Claiming Account",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-elegant glass-card border border-border/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-5 w-5" />
          Claim Your Account
        </CardTitle>
        <CardDescription>
          We found an existing profile for {email}. Set a password to claim your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2">Your Profile Information:</h4>
            <p className="text-sm text-muted-foreground">
              Name: {existingProfile.first_name} {existingProfile.last_name}
            </p>
            {existingProfile.phone && (
              <p className="text-sm text-muted-foreground">
                Phone: {existingProfile.phone}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Email: {email}
            </p>
          </div>

          <form onSubmit={handleClaimAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a new password"
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
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Claim Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};