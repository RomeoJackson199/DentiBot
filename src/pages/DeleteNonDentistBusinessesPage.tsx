import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteNonDentistBusinesses } from '@/scripts/deleteNonDentistBusinesses';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  slug: string;
  template_type: string;
}

export default function DeleteNonDentistBusinessesPage() {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoadingList(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug, template_type')
        .eq('owner_profile_id', profile.id);

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error: any) {
      console.error('Error loading businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoadingList(false);
    }
  };

  const handleDelete = async () => {
    const nonHealthcare = businesses.filter(b => b.template_type !== 'healthcare');
    
    if (nonHealthcare.length === 0) {
      toast.info('No non-healthcare businesses found to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${nonHealthcare.length} non-healthcare businesses? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteNonDentistBusinesses();
      setResult(result);
      
      if (result.deletedCount === 0) {
        toast.info(result.message || 'No non-healthcare businesses found to delete');
      } else {
        toast.success(`Successfully deleted ${result.deletedCount} businesses`);
      }
      
      // Reload the list
      await loadBusinesses();
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
              This action will delete all businesses with template types other than 'healthcare'.
              This includes all related data (appointments, services, homepage settings, etc.).
              <br /><br />
              <strong>This cannot be undone!</strong>
            </AlertDescription>
          </Alert>

          {loadingList ? (
            <p className="text-center text-muted-foreground py-4">Loading your businesses...</p>
          ) : (
            <>
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">Your Current Businesses:</h3>
                {businesses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No businesses found</p>
                ) : (
                  <div className="space-y-2">
                    {businesses.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <span>{b.name} ({b.slug})</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          b.template_type === 'healthcare' 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-red-500/10 text-red-600'
                        }`}>
                          {b.template_type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleDelete} 
                  disabled={loading || businesses.filter(b => b.template_type !== 'healthcare').length === 0}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? 'Deleting...' : `Delete Non-Healthcare Businesses (${businesses.filter(b => b.template_type !== 'healthcare').length})`}
                </Button>
                <Button
                  onClick={loadBusinesses}
                  disabled={loadingList}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

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
