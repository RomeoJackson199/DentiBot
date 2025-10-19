import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const PatientSignup = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'dentist'>('patient');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
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
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Get Started
            </h1>
            <p className="text-muted-foreground">
              Create your DentiBot account in seconds
            </p>
          </div>
          
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>I am a...</CardTitle>
              <CardDescription>Select your account type to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'patient' | 'dentist')}>
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Patient</div>
                    <div className="text-sm text-muted-foreground">Book appointments and manage my dental care</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all">
                  <RadioGroupItem value="dentist" id="dentist" />
                  <Label htmlFor="dentist" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Dentist / Practice</div>
                    <div className="text-sm text-muted-foreground">Manage patients and appointments</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          <AuthForm initialRole={selectedRole} />
          
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSignup;
