import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { ArrowLeft, Stethoscope, Building2, Calendar, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [clinicColor, setClinicColor] = useState<string>('#0F3D91');

  // Get selected clinic info from session storage
  const selectedClinicDentistId = sessionStorage.getItem('selectedClinicDentistId');
  const selectedClinicSlug = sessionStorage.getItem('selectedClinicSlug');
  const selectedClinicName = sessionStorage.getItem('selectedClinicName');
  const accessMode = sessionStorage.getItem('accessMode') as 'admin' | 'patient' | null;

  // Fetch clinic branding
  useEffect(() => {
    const fetchClinicBranding = async () => {
      if (!selectedClinicDentistId) return;

      const { data } = await supabase
        .from('clinic_settings')
        .select('logo_url, primary_color')
        .eq('dentist_id', selectedClinicDentistId)
        .maybeSingle();

      if (data) {
        setClinicLogo(data.logo_url);
        setClinicColor(data.primary_color || '#0F3D91');
      }
    };

    fetchClinicBranding();
  }, [selectedClinicDentistId]);

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

  const handleBackToSelection = () => {
    // Clear session storage and go back to homepage
    sessionStorage.removeItem('selectedClinicDentistId');
    sessionStorage.removeItem('selectedClinicSlug');
    sessionStorage.removeItem('selectedClinicName');
    sessionStorage.removeItem('accessMode');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={handleBackToSelection}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clinic Selection
        </Button>
      </div>

      {/* Clinic Context Banner */}
      {selectedClinicName && (
        <div className="px-4 pb-4">
          <Alert className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <AlertDescription>
              <div className="flex items-center gap-4">
                {clinicLogo ? (
                  <img 
                    src={clinicLogo} 
                    alt={selectedClinicName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${clinicColor}20` }}
                  >
                    <Building2 className="w-6 h-6" style={{ color: clinicColor }} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{selectedClinicName}</span>
                    {accessMode && (
                      <Badge variant={accessMode === 'admin' ? 'default' : 'secondary'}>
                        {accessMode === 'admin' ? (
                          <><UserCog className="w-3 h-3 mr-1" /> Admin Access</>
                        ) : (
                          <><Calendar className="w-3 h-3 mr-1" /> Patient Booking</>
                        )}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {accessMode === 'admin' 
                      ? 'You\'re signing in to manage this clinic' 
                      : 'You\'re signing in to book an appointment'}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {clinicLogo ? (
              <div className="flex justify-center mb-4">
                <img 
                  src={clinicLogo} 
                  alt={selectedClinicName || "Clinic Logo"} 
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
              {accessMode === 'admin' ? 'Sign In to Manage' : 'Sign In to Continue'}
            </h1>
            <p className="text-muted-foreground">
              {selectedClinicName 
                ? `Access ${selectedClinicName}` 
                : 'Sign in to your account'}
            </p>
          </div>
          
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
