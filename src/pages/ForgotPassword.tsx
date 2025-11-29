import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          <div className="max-w-md space-y-6 text-center">
            <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto backdrop-blur-sm">
              <Mail className="h-10 w-10" />
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              We'll help you get back in
            </h2>
            <p className="text-lg text-white/90">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">DentiBot</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive reset instructions
            </p>
          </div>

          {emailSent ? (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-8 shadow-sm text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent password reset instructions to
                  </p>
                  <p className="text-sm font-medium mt-1">{email}</p>
                </div>
                <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                  <p>Didn't receive the email? Check your spam folder.</p>
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Try a different email
                  </button>
                </div>
              </div>

              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Send reset instructions"
                    )}
                  </Button>
                </form>
              </div>

              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
