import { useEffect, useMemo, useState } from "react";
import { supabase, getFunctionUrl } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, ShieldAlert } from "lucide-react";

interface ProfileRow {
  id: string;
  email: string;
  user_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const first = local[0] ?? "";
  return `${first}${"\u2022".repeat(Math.max(0, local.length - 1))}@${domain}`;
};

const Claim = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "password" | "neutral" | "error">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [qualifyingProfile, setQualifyingProfile] = useState<ProfileRow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isProduction = useMemo(() => (import.meta as any).env?.MODE === "production" || (import.meta as any).env?.PROD === true, []);
  const isNonProduction = !isProduction;

  useEffect(() => {
    if (isProduction) {
      // In production, do not expose bypass flow; show neutral guidance
      setStep("neutral");
    }
  }, [isProduction]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProduction) {
      setStep("neutral");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, user_id, first_name, last_name, phone")
        .eq("email", normalizedEmail);

      if (error) {
        // Fail safe to neutral to avoid enumeration
        setStep("neutral");
        return;
      }

      const claimable = (data || []).filter((p) => p.user_id === null);

      if (claimable.length > 1) {
        // Duplicate imported records; show generic error instructing to contact clinic
        setErrorMessage("Something went wrong. Please contact the clinic to complete your access.");
        setStep("error");
        return;
      }

      if (claimable.length === 1 && isNonProduction) {
        setQualifyingProfile(claimable[0]);
        setStep("password");
        return;
      }

      // Not found or not claimable
      setStep("neutral");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qualifyingProfile) return;

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please re-enter your password.", variant: "destructive" });
      return;
    }

    if (password.length < 12) {
      toast({ title: "Password too short", description: "Use at least 12 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Call dev-only bypass function to create user and link profile without email/SMS
      const res = await fetch(getFunctionUrl("dev-claim-bypass"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, profileId: qualifyingProfile.id })
      });

      if (!res.ok) {
        // Show neutral if the backend rejected; don't leak details
        if (res.status === 403 || res.status === 404) {
          setStep("neutral");
          return;
        }
        const body = await res.json().catch(() => ({}));
        const message = body?.error || "Unable to complete account claim.";
        setErrorMessage(message);
        setStep("error");
        return;
      }

      // Attempt sign-in immediately with the new password (email marked confirmed server-side)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (signInError) {
        setErrorMessage("We couldn't sign you in. Please try again.");
        setStep("error");
        return;
      }

      // Navigate to dashboard; ProfileCompletionDialog will handle missing fields
      navigate("/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg">
      <div className="w-full max-w-md space-y-4">
        {isNonProduction && (
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            <span>Dev environment — account claim bypass enabled</span>
          </div>
        )}

        {step === "email" && (
          <Card className="shadow-elegant glass-card border border-border/20">
            <CardHeader>
              <CardTitle>Account Claim</CardTitle>
              <CardDescription>Enter your email. If we find your profile, we’ll help you secure it.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
                <div className="text-center text-sm">
                  <a className="text-dental-primary underline" href="/">Back to standard login</a>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "password" && qualifyingProfile && (
          <Card className="shadow-elegant glass-card border border-border/20">
            <CardHeader>
              <CardTitle>We found your profile. Let’s secure it with a password.</CardTitle>
              <CardDescription>
                {maskEmail(email)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      minLength={12}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Use at least 12 characters. Avoid common phrases or personal info.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-500">Passwords don’t match</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !password || password !== confirmPassword}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save and continue"}
                </Button>
                <div className="text-center text-sm">
                  <a className="text-dental-primary underline" href="/">Back to standard login</a>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "neutral" && (
          <Card className="shadow-elegant glass-card border border-border/20">
            <CardHeader>
              <CardTitle>Account Claim</CardTitle>
              <CardDescription>If an account exists for this email, we’ll help you sign in.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" onClick={() => navigate("/", { replace: true })}>Back to login</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "error" && (
          <Card className="shadow-elegant glass-card border border-border/20">
            <CardHeader>
              <CardTitle>We’re having trouble</CardTitle>
              <CardDescription>{errorMessage || "Please try again or contact the clinic for assistance."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" onClick={() => navigate("/", { replace: true })}>Back to login</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Claim;