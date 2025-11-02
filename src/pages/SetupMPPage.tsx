import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { setupMPHomepage } from "@/scripts/setupMPHomepage";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SetupMPPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await setupMPHomepage();
      
      if (result.success) {
        setDone(true);
        toast({
          title: "Success!",
          description: "MP homepage has been set up successfully!",
        });
      } else {
        throw new Error("Setup failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to set up homepage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Setup MP Hairdresser Homepage</CardTitle>
          <CardDescription>
            This will set up the custom homepage for MP with hairdresser images and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!done ? (
            <Button 
              onClick={handleSetup} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Setup MP Homepage"
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Setup Complete!</span>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open("/mp", "_blank")}
                  className="w-full"
                  size="lg"
                >
                  View MP Homepage
                </Button>
                <Button 
                  onClick={() => navigate("/admin/homepage-manager")}
                  variant="outline"
                  className="w-full"
                >
                  Open Homepage Manager
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
