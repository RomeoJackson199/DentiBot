import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

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

  const handleSelectClinic = (clinic: Clinic) => {
    // Store selected clinic info in sessionStorage (more secure than localStorage for session data)
    sessionStorage.setItem('selectedClinicDentistId', clinic.dentist_id);
    sessionStorage.setItem('selectedClinicSlug', clinic.business_slug);
    sessionStorage.setItem('selectedClinicName', clinic.clinic_name);
    
    // Navigate to login
    navigate('/login');
  };

  if (loading) {
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
          {clinics.map((clinic) => (
            <Card 
              key={clinic.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleSelectClinic(clinic)}
            >
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
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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

                {/* CTA */}
                <Button 
                  className="w-full"
                  style={{ 
                    backgroundColor: clinic.primary_color,
                    color: 'white'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectClinic(clinic);
                  }}
                >
                  Access Clinic
                </Button>
              </div>
            </Card>
          ))}
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
