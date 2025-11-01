import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserTour } from "@/components/UserTour";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DemoTourFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoTourFlow({ isOpen, onClose }: DemoTourFlowProps) {
  const [step, setStep] = useState<"setup" | "dentist-tour" | "patient-tour" | "signup">("setup");
  const [businessName, setBusinessName] = useState("");
  const [template, setTemplate] = useState("dentist");
  const navigate = useNavigate();

  const handleStartDemo = () => {
    if (!businessName.trim()) return;
    setStep("dentist-tour");
  };

  const handleDentistTourComplete = () => {
    setStep("patient-tour");
  };

  const handlePatientTourComplete = () => {
    setStep("signup");
  };

  const handleSignup = () => {
    // Store demo data for quick signup
    sessionStorage.setItem('demo_business_name', businessName);
    sessionStorage.setItem('demo_template', template);
    onClose();
    navigate('/signup');
  };

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <>
      <Dialog open={isOpen && step === "setup"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-2xl">Try Demo Tour</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Experience Caberu with a guided tour. Preview both dentist and patient views before creating your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="e.g., Smile Dental Clinic"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                This is just for the demo - you can change it later
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Business Type</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dentist">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Dental Practice
                    </div>
                  </SelectItem>
                  <SelectItem value="medical">Medical Clinic</SelectItem>
                  <SelectItem value="salon">Salon & Spa</SelectItem>
                  <SelectItem value="fitness">Fitness Center</SelectItem>
                  <SelectItem value="generic">General Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                What you'll see:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Provider dashboard tour (dentist view)</li>
                <li>• Patient portal tour (patient view)</li>
                <li>• All features explained step-by-step</li>
                <li>• Takes about 3-4 minutes</li>
              </ul>
            </div>

            <Button
              onClick={handleStartDemo}
              disabled={!businessName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              Start Demo Tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              No credit card required • Takes 3-4 minutes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dentist Tour */}
      {step === "dentist-tour" && (
        <UserTour
          isOpen={true}
          onClose={handleDentistTourComplete}
          userRole="dentist"
        />
      )}

      {/* Patient Tour */}
      {step === "patient-tour" && (
        <UserTour
          isOpen={true}
          onClose={handlePatientTourComplete}
          userRole="patient"
        />
      )}

      {/* Signup Prompt */}
      <Dialog open={step === "signup"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-2xl">Ready to Get Started?</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              You've seen how Caberu works! Create your account to build your own {businessName} portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-lg">Create Your Business</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Business name: <strong>{businessName}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Template: <strong>{template}</strong></span>
                </div>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">€1.00</span>
                  <span className="text-sm text-muted-foreground">one-time activation fee</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                Create Account & Pay €1
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleLogin}
                variant="outline"
                className="w-full"
                size="lg"
              >
                I Already Have an Account
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment • Instant activation • Cancel anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
