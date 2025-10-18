import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, ArrowRight, Loader2, Stethoscope, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface Clinic {
  id: string;
  clinic_name: string;
  business_slug: string;
  logo_url: string | null;
  tagline: string | null;
  primary_color: string;
  dentist_id: string;
}

export function ClinicSelector() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDentistId, setUserDentistId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isDentist, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    fetchClinics();
    checkUserDentistId();
  }, []);

  const checkUserDentistId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: dentistData } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (dentistData) {
          setUserDentistId(dentistData.id);
        }
      }
    } catch (error) {
      console.error('Error checking user dentist ID:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      // Fetch all active clinics with their settings
      const { data: clinicData, error } = await supabase
        .from('clinic_settings')
        .select(`
          id,
          dentist_id,
          clinic_name,
          business_slug,
          logo_url,
          tagline,
          primary_color
        `)
        .not('clinic_name', 'is', null)
        .not('business_slug', 'is', null)
        .order('clinic_name');

      if (error) throw error;
      setClinics(clinicData || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClinic = (clinic: Clinic, mode: 'admin' | 'patient') => {
    console.log(`Selecting clinic ${clinic.clinic_name} in ${mode} mode`);
    
    // Store selected clinic info in sessionStorage
    sessionStorage.setItem('selectedClinicDentistId', clinic.dentist_id);
    sessionStorage.setItem('selectedClinicSlug', clinic.business_slug);
    sessionStorage.setItem('selectedClinicName', clinic.clinic_name);
    sessionStorage.setItem('accessMode', mode);
    
    // Navigate to login
    navigate('/login');
  };

  const isOwnClinic = (clinic: Clinic) => {
    return userDentistId && clinic.dentist_id === userDentistId;
  };

  if (loading || roleLoading) {
    return (
      <section className="py-16 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading clinics...</p>
          </div>
        </div>
      </section>
    );
  }

  if (clinics.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Select Your Clinic</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the dental practice you'd like to access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {clinics.map((clinic) => {
            const ownClinic = isOwnClinic(clinic);
            const showAdminOption = (isDentist || isAdmin) && ownClinic;

            return (
              <Card 
                key={clinic.id}
                className="p-6 hover:shadow-lg transition-all group relative overflow-hidden"
              >
                {/* Status Badge */}
                {ownClinic && (
                  <Badge 
                    className="absolute top-4 right-4 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    Your Clinic
                  </Badge>
                )}

                <div className="space-y-4">
                  {/* Logo or Icon */}
                  <div className="flex items-center justify-between">
                    {clinic.logo_url ? (
                      <img 
                        src={clinic.logo_url} 
                        alt={clinic.clinic_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${clinic.primary_color}20` }}
                      >
                        <Building2 
                          className="w-8 h-8" 
                          style={{ color: clinic.primary_color }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Clinic Info */}
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {clinic.clinic_name}
                    </h3>
                    {clinic.tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {clinic.tagline}
                      </p>
                    )}
                  </div>

                  {/* Slug as identifier */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>@{clinic.business_slug}</span>
                  </div>

                  {/* Action Buttons */}
                  {showAdminOption ? (
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        style={{ 
                          backgroundColor: clinic.primary_color,
                          color: 'white'
                        }}
                        onClick={() => handleSelectClinic(clinic, 'admin')}
                      >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Manage Clinic
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => handleSelectClinic(clinic, 'patient')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book as Patient
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full group"
                      style={{ 
                        backgroundColor: clinic.primary_color,
                        color: 'white'
                      }}
                      onClick={() => handleSelectClinic(clinic, 'patient')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Appointment
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            Don't see your clinic?
          </p>
          <Button variant="outline" asChild>
            <a href="/start">Create Your Clinic</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
