import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Business {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface BusinessPickerHomepageProps {
  onBusinessSelected: (businessId: string) => void;
}

export function BusinessPickerHomepage({ onBusinessSelected }: BusinessPickerHomepageProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, tagline, logo_url, primary_color, secondary_color")
        .order("name");

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (businessId: string) => {
    localStorage.setItem("selected_business_id", businessId);
    onBusinessSelected(businessId);
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Select Your Clinic</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your dental clinic to get started with booking appointments
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle>No Clinics Available</CardTitle>
              <CardDescription>
                There are currently no dental clinics available in the system.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Select Your Clinic</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose your dental clinic to get started with booking appointments and accessing care
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {businesses.map((business) => (
            <Card 
              key={business.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSelectBusiness(business.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {business.logo_url ? (
                      <img 
                        src={business.logo_url} 
                        alt={business.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: business.primary_color + '20' }}
                      >
                        <Building2 
                          className="w-6 h-6" 
                          style={{ color: business.primary_color }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {business.name}
                      </CardTitle>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {business.tagline && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {business.tagline}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectBusiness(business.id);
                  }}
                >
                  Select Clinic
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
