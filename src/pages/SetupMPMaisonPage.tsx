import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setupMPMaisonHomepage } from "@/scripts/setupMPMaisonHomepage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SetupMPMaisonPage() {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await setupMPMaisonHomepage();
      
      if (result.success) {
        toast.success("Homepage settings created successfully!");
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Failed to setup homepage");
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("An error occurred during setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup MP Maison Homepage</CardTitle>
          <CardDescription>
            Click the button below to set up the homepage for MP Maison business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSetup} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Setting up..." : "Run Setup"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            This will create homepage settings for the MP Maison business. Make sure the business exists with slug "mp_maison" or "mp-maison".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
