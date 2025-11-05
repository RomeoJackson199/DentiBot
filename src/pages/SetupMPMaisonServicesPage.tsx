import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setupMPMaisonServices } from '@/scripts/setupMPMaisonServices';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SetupMPMaisonServicesPage() {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await setupMPMaisonServices();
      if (result.success) {
        toast.success('Services setup completed successfully!');
      } else {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to setup services');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup MP Maison Services</CardTitle>
          <CardDescription>
            Click the button below to add all services to the MP Maison business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSetup} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Setting up...' : 'Setup Services'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
