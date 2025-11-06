import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  slug: string;
  template_type: string;
}

export default function DeleteBusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get businesses where user is owner
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
      setLoading(false);
    }
  };

  const deleteBusiness = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${businessName}"? This cannot be undone!`)) {
      return;
    }

    setDeleting(businessId);
    try {
      // Delete related data first
      await supabase.from('homepage_settings').delete().eq('business_id', businessId);
      await supabase.from('business_services').delete().eq('business_id', businessId);
      await supabase.from('appointment_slots').delete().eq('business_id', businessId);
      await supabase.from('dentist_availability').delete().eq('business_id', businessId);
      await supabase.from('dentist_vacation_days').delete().eq('business_id', businessId);
      await supabase.from('medical_records').delete().eq('business_id', businessId);
      await supabase.from('treatment_plans').delete().eq('business_id', businessId);
      await supabase.from('payment_requests').delete().eq('business_id', businessId);
      await supabase.from('appointments').delete().eq('business_id', businessId);
      await supabase.from('business_members').delete().eq('business_id', businessId);
      await supabase.from('session_business').delete().eq('business_id', businessId);

      // Finally delete the business
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      toast.success(`Business "${businessName}" deleted successfully`);
      loadBusinesses();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      toast.error(error.message || 'Failed to delete business');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Businesses
          </CardTitle>
          <CardDescription>
            Permanently delete businesses you own. All data will be lost.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting a business will permanently remove:
              <ul className="list-disc list-inside mt-2">
                <li>All appointments and bookings</li>
                <li>All services and products</li>
                <li>All medical records and treatment plans</li>
                <li>All payment requests and history</li>
                <li>All staff members and their access</li>
              </ul>
              <strong className="block mt-2">This action cannot be undone!</strong>
            </AlertDescription>
          </Alert>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading businesses...</p>
          ) : businesses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No businesses found</p>
          ) : (
            <div className="space-y-3">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {business.slug} • {business.template_type}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteBusiness(business.id, business.name)}
                    disabled={deleting === business.id}
                  >
                    {deleting === business.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
