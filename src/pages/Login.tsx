import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Business = {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
};

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    () => localStorage.getItem("selected_business_id")
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const loadBusinesses = async () => {
      setIsLoadingBusinesses(true);
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, tagline, logo_url")
          .order("name");

        if (error) throw error;
        setBusinesses(data || []);
      } catch (error) {
        console.error("Error loading businesses:", error);
      } finally {
        setIsLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return businesses;
    }

    return businesses.filter((business) => {
      const nameMatches = business.name.toLowerCase().includes(term);
      const taglineMatches = business.tagline?.toLowerCase().includes(term) ?? false;

      return nameMatches || taglineMatches;
    });
  }, [businesses, searchTerm]);

  const selectedBusiness = useMemo(
    () => (selectedBusinessId ? businesses.find((business) => business.id === selectedBusinessId) : undefined),
    [businesses, selectedBusinessId]
  );

  const handleSelectBusiness = (businessId: string) => {
    localStorage.setItem("selected_business_id", businessId);
    setSelectedBusinessId(businessId);

    const business = businesses.find((item) => item.id === businessId);
    if (business) {
      toast({
        title: `${business.name} selected`,
        description: "Sign in on the right to continue to this workspace.",
        duration: 3500,
      });
    }
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

      const storedBusinessId = localStorage.getItem("selected_business_id");
      if (storedBusinessId) {
        await supabase.functions
          .invoke("set-current-business", {
            body: { businessId: storedBusinessId },
          })
          .catch(console.warn);
        localStorage.removeItem("selected_business_id");
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      const errorMessage = error.message.toLowerCase();
      let userFriendlyMessage = "Unable to sign in. Please try again.";

      if (errorMessage.includes("invalid") || errorMessage.includes("credentials")) {
        userFriendlyMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (errorMessage.includes("email not confirmed")) {
        userFriendlyMessage = "Please verify your email before signing in. Check your inbox for the confirmation link.";
      } else if (errorMessage.includes("network")) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: "❌ Sign in failed",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "❌ Google sign in failed",
        description: "Unable to sign in with Google. Please try again or use email/password.",
        variant: "destructive",
        duration: 6000,
      });
      setIsLoading(false);
    }
  };

  const renderBusinessList = (layout: "desktop" | "mobile") => {
    const isDesktop = layout === "desktop";

    if (isLoadingBusinesses) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`${layout}-skeleton-${index}`}
              className={cn(
                "h-24 w-full rounded-2xl",
                isDesktop ? "bg-white/10" : "bg-slate-200/60"
              )}
            />
          ))}
        </div>
      );
    }

    if (filteredBusinesses.length === 0) {
      return (
        <p className={cn("text-sm", isDesktop ? "text-white/70" : "text-muted-foreground")}>
          No businesses found.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {filteredBusinesses.map((business) => {
          const isSelected = selectedBusinessId === business.id;

          return (
            <button
              key={business.id}
              type="button"
              onClick={() => handleSelectBusiness(business.id)}
              className={cn(
                "w-full rounded-2xl border p-5 text-left transition-all duration-200 group",
                isDesktop
                  ? "border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md",
                isSelected &&
                  (isDesktop
                    ? "border-white bg-white/20 shadow-lg"
                    : "border-primary shadow-lg")
              )}
            >
              <div className="flex items-center gap-4">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    className={cn(
                      "h-12 w-12 rounded-xl object-cover",
                      isDesktop ? "bg-white/90" : "bg-slate-100"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      isDesktop ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-lg font-semibold", isDesktop ? "text-white" : "text-slate-900")}>
                    {business.name}
                  </p>
                  {business.tagline && (
                    <p className={cn("mt-1 truncate text-sm", isDesktop ? "text-white/70" : "text-slate-500")}>
                      {business.tagline}
                    </p>
                  )}
                </div>
                {isSelected ? (
                  <Check
                    className={cn(
                      "h-5 w-5",
                      isDesktop ? "text-white" : "text-primary"
                    )}
                  />
                ) : (
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isDesktop
                        ? "text-white/60 group-hover:text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-slate-950 text-white">
        <div className="flex-1 space-y-8 overflow-y-auto p-12">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-wide text-white/80">
              Choose your workspace
            </span>
            <h2 className="text-4xl font-semibold leading-tight">
              Businesses on the left, sign in on the right
            </h2>
            <p className="text-sm text-white/70">
              Pick your business to tailor automations, messaging, and reports to the right location.
            </p>
          </div>
          <div className="space-y-4">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search businesses"
              className="border-white/20 bg-white/10 text-white placeholder:text-white/60"
            />
            {renderBusinessList("desktop")}
          </div>
        </div>
        <div className="border-t border-white/10 p-8 text-sm text-white/70">
          Need a new workspace?{" "}
          <a href="/create-business" className="font-semibold text-white underline-offset-4 hover:underline">
            Create a business
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden border-b border-slate-200 bg-muted/40">
          <div className="space-y-4 px-6 py-8">
            <h2 className="text-xl font-semibold text-slate-900">Choose your business</h2>
            <p className="text-sm text-muted-foreground">
              Pick the business you manage so we can log you into the right workspace.
            </p>
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search businesses"
            />
            {renderBusinessList("mobile")}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Access your workspace and keep every patient journey on track.
              </p>
              {selectedBusiness && (
                <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Building2 className="h-4 w-4" />
                  {selectedBusiness.name}
                </div>
              )}
            </div>

            <div className="rounded-3xl border bg-card p-8 shadow-sm">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 border-2 hover:bg-accent"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full bg-primary text-lg font-semibold hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="font-medium text-primary hover:underline">
                      Sign up
                    </Link>
                  </p>
                </form>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
