import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setupArtBarberHomepage } from "@/scripts/setupArtBarberHomepage";
import { setupArtBarberServices } from "@/scripts/setupArtBarberServices";
import { useToast } from "@/hooks/use-toast";

export default function SetupArtBarberPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setLoading(true);
    try {
      const homepageResult = await setupArtBarberHomepage();
      const servicesResult = await setupArtBarberServices();

      if (homepageResult.success && servicesResult.success) {
        toast({
          title: "Success!",
          description: "Art Barber homepage and services have been set up successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "There was an error setting up the page. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Setup Art Barber Homepage</h1>
        <p className="mb-6 text-muted-foreground">
          Click the button below to set up the homepage and services for Art Barber.
        </p>
        <Button onClick={handleSetup} disabled={loading} className="w-full">
          {loading ? "Setting up..." : "Setup Homepage & Services"}
        </Button>
      </Card>
    </div>
  );
}
