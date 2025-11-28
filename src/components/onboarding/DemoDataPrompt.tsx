import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Calendar,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { generateDemoData, clearDemoData } from "@/lib/demoDataGenerator";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface DemoDataPromptProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  userId: string;
  onDemoDataGenerated?: () => void;
}

export function DemoDataPrompt({
  isOpen,
  onClose,
  businessId,
  userId,
  onDemoDataGenerated,
}: DemoDataPromptProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    patientsCreated: number;
    appointmentsCreated: number;
    medicalRecordsCreated: number;
  } | null>(null);
  const { toast } = useToast();

  const handleGenerateDemoData = async () => {
    setLoading(true);
    setProgress(10);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const result = await generateDemoData({
        businessId,
        userId,
        numberOfPatients: 15,
        numberOfAppointments: 25,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setCompleted(true);
        setStats(result.data!);
        toast({
          title: "Demo Data Created! 🎉",
          description: result.message,
        });

        // Notify parent component
        onDemoDataGenerated?.();

        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setError(result.error || "Failed to generate demo data");
        toast({
          title: "Error",
          description: result.error || "Failed to generate demo data",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // User chose to skip demo data
    localStorage.setItem("demo-data-skipped", "true");
    onClose();
  };

  const handleClose = () => {
    setProgress(0);
    setCompleted(false);
    setError(null);
    setStats(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {completed ? "All Set!" : "Try With Demo Data"}
              </DialogTitle>
              <DialogDescription>
                {completed
                  ? "Your demo data is ready to explore"
                  : "Explore the platform with sample data"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!completed && !loading && (
          <>
            <div className="space-y-4 py-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  We'll create realistic sample data so you can explore all features
                  without setting up everything manually. You can delete this data
                  anytime.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">What we'll create:</h4>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">15 Demo Patients</p>
                      <p className="text-xs text-muted-foreground">
                        With realistic names, contact info, and medical history
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">25 Sample Appointments</p>
                      <p className="text-xs text-muted-foreground">
                        Past, current, and future appointments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Medical Records</p>
                      <p className="text-xs text-muted-foreground">
                        Sample treatment notes and prescriptions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> All demo data is clearly marked and can be
                  removed with one click from your settings.
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
              <h4 className="font-semibold mb-2">Creating your demo data...</h4>
              <p className="text-sm text-muted-foreground">
                This will take just a moment
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {completed && stats && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-xl font-bold">Demo Data Created! 🎉</h4>
              <p className="text-sm text-muted-foreground">
                You're ready to explore all the features
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.patientsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.appointmentsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats.medicalRecordsCreated}
                </p>
                <p className="text-xs text-muted-foreground">Records</p>
              </div>
            </div>
          </div>
        )}

        {!completed && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleGenerateDemoData}
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Demo Data
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
