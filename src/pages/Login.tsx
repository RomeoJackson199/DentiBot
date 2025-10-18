import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClinicBranding } from "@/hooks/useClinicBranding";

const Login = () => {
  const navigate = useNavigate();
  const { branding } = useClinicBranding();

  // Get selected clinic info from session storage
  const selectedClinicSlug = sessionStorage.getItem('selectedClinicSlug');
  const selectedClinicName = sessionStorage.getItem('selectedClinicName');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Always go to homepage, let UnifiedDashboard handle routing
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Always go to homepage, let UnifiedDashboard handle routing
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {branding.logoUrl ? (
              <div className="flex justify-center mb-4">
                <img 
                  src={branding.logoUrl} 
                  alt={branding.clinicName || "Clinic Logo"} 
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Stethoscope className="h-12 w-12 text-primary" />
                </div>
              </div>
            )}
            <h1 className="text-4xl font-bold gradient-text mb-2">
              {selectedClinicName ? `Welcome to ${selectedClinicName}` : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground">
              {selectedClinicName 
                ? `Sign in to access ${selectedClinicName}` 
                : `Sign in to access ${branding.clinicName || "your DentiBot account"}`}
            </p>
          </div>
          
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
