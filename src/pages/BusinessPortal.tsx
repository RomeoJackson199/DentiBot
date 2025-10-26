import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2 } from "lucide-react";

export default function BusinessPortal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBusinessAndAuth();
  }, [slug]);

  const checkBusinessAndAuth = async () => {
    try {
      // Check if business exists
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (businessError || !businessData) {
        setError("Business not found");
        setLoading(false);
        return;
      }

      setBusiness(businessData);

      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        // Set this business as current business
        await setBusinessContext(currentUser.id, businessData.id);
        
        // Get user's role to determine redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", currentUser.id)
          .single();

        if (profile) {
          // Check if user is a member of this business
          const { data: membership } = await supabase
            .from("business_members")
            .select("role")
            .eq("business_id", businessData.id)
            .eq("profile_id", profile.id)
            .single();

          if (membership) {
            // Redirect to dentist portal if they're a business member
            navigate("/dentist");
          } else {
            // Otherwise, they're a patient - redirect to patient portal
            navigate("/patient");
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error checking business:", err);
      setError("An error occurred");
      setLoading(false);
    }
  };

  const setBusinessContext = async (userId: string, businessId: string) => {
    await supabase
      .from("session_business")
      .upsert({
        user_id: userId,
        business_id: businessId,
        updated_at: new Date().toISOString(),
      });
  };

  const handleAuthSuccess = async () => {
    // Reload to trigger the auth check and redirect
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ModernLoadingSpinner />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || "Business not found"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-2">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {business.logo_url ? (
                <img 
                  src={business.logo_url} 
                  alt={business.name}
                  className="w-12 h-12 object-contain rounded-full"
                />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{business.name}</CardTitle>
              {business.tagline && (
                <CardDescription className="mt-2">
                  {business.tagline}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertDescription>
                Sign in or create an account to book appointments with {business.name}
              </AlertDescription>
            </Alert>
            <UnifiedAuthForm onSignInSuccess={handleAuthSuccess} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

