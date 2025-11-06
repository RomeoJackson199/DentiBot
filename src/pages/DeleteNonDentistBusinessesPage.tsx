import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteNonDentistBusinesses } from '@/scripts/deleteNonDentistBusinesses';
import { toast } from 'sonner';
import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DeleteNonDentistBusinessesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete all non-dentist businesses? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteNonDentistBusinesses();
      setResult(result);
      
      if (result.deletedCount === 0) {
        toast.info('No non-dentist businesses found to delete');
      } else {
        toast.success(`Successfully deleted ${result.deletedCount} businesses`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to delete businesses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Non-Dentist Businesses
          </CardTitle>
          <CardDescription>
            This will permanently delete all businesses that are not dentist/healthcare clinics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action will delete all businesses with template types other than 'dentist' or 'healthcare'.
              This includes all related data (appointments, services, homepage settings, etc.).
              <br /><br />
              <strong>This cannot be undone!</strong>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleDelete} 
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? 'Deleting...' : 'Delete Non-Dentist Businesses'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <p>Deleted {result.deletedCount} businesses</p>
              {result.deletedBusinesses && result.deletedBusinesses.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.deletedBusinesses.map((b: any, i: number) => (
                    <li key={i} className="text-sm">
                      • {b.name} ({b.slug})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
