import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernLoadingSpinner } from "./enhanced/ModernLoadingSpinner";

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  primary_color: string;
  owner_profile_id: string;
}

export function BusinessSelector() {
  const navigate = useNavigate();
  const { isProvider, isAdmin } = useUserRole();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
    checkUserProfileId();
  }, []);

  const checkUserProfileId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        setUserProfileId(profile.id);
      }
    }
  };

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Try new businesses table first
      let { data, error } = await supabase
        .from('businesses' as any)
        .select('id, name, slug, logo_url, tagline, primary_color, owner_profile_id')
        .order('name');

      // Fallback to old clinic_settings table if businesses table not available yet
      if (error && error.message?.includes('Could not find the table')) {
        console.log('Falling back to clinic_settings table...');
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinic_settings')
          .select('id, clinic_name, business_slug, logo_url, tagline, primary_color, dentist_id')
          .not('clinic_name', 'is', null)
          .not('business_slug', 'is', null)
          .order('clinic_name');
        
        if (clinicError) throw clinicError;
        
        // Map clinic_settings data to Business interface
        const mappedData = (clinicData || []).map((clinic: any) => ({
          id: clinic.id,
          name: clinic.clinic_name,
          slug: clinic.business_slug,
          logo_url: clinic.logo_url,
          tagline: clinic.tagline,
          primary_color: clinic.primary_color,
          owner_profile_id: clinic.dentist_id // Will need to lookup actual profile_id
        }));
        
        setBusinesses(mappedData);
        return;
      }

      if (error) throw error;
      setBusinesses((data as any) || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: Business, mode: 'admin' | 'customer') => {
    console.log('Selected business:', business.name, 'Mode:', mode);
    
    sessionStorage.setItem('selectedBusinessId', business.id);
    sessionStorage.setItem('selectedBusinessSlug', business.slug);
    sessionStorage.setItem('selectedBusinessName', business.name);
    sessionStorage.setItem('accessMode', mode);
    
    navigate('/login');
  };

  const isOwnBusiness = (business: Business) => {
    return userProfileId === business.owner_profile_id;
  };

  if (loading) {
    return <ModernLoadingSpinner />;
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Select a Business</h2>
          <p className="text-muted-foreground text-lg">
            Choose a business to book an appointment or manage your services
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: business.primary_color }}
                  >
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="w-8 h-8" />
                    )}
                  </div>
                  {isOwnBusiness(business) && (
                    <Badge variant="secondary">Your Business</Badge>
                  )}
                </div>
                <div>
                  <CardTitle className="mb-2">{business.name}</CardTitle>
                  {business.tagline && (
                    <CardDescription>{business.tagline}</CardDescription>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">@{business.slug}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(isProvider || isAdmin) && isOwnBusiness(business) ? (
                  <>
                    <Button 
                      className="w-full gap-2"
                      onClick={() => handleSelectBusiness(business, 'admin')}
                    >
                      <Settings className="w-4 h-4" />
                      Manage Business
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => handleSelectBusiness(business, 'customer')}
                    >
                      <Calendar className="w-4 h-4" />
                      Book as Customer
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleSelectBusiness(business, 'customer')}
                  >
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No businesses found</p>
            {(isProvider || isAdmin) && (
              <Button onClick={() => navigate('/business/create')}>
                Create Your Business
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
