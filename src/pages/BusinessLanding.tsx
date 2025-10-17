import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail } from 'lucide-react';

export const BusinessLanding: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_settings(
            logo_url,
            tagline,
            clinic_name,
            business_name
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="container max-w-4xl">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return <Navigate to="/" replace />;
  }

  const settings = organization.organization_settings?.[0];

  return (
    <div className="min-h-screen mesh-bg">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {settings?.logo_url && (
            <img 
              src={settings.logo_url} 
              alt={organization.name}
              className="h-20 mx-auto mb-4"
            />
          )}
          <h1 className="text-5xl font-bold gradient-text mb-4">
            {organization.name}
          </h1>
          {settings?.tagline && (
            <p className="text-xl text-muted-foreground">
              {settings.tagline}
            </p>
          )}
        </div>

        {/* Main CTA */}
        <div className="bg-card border rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Appointment</h2>
          <p className="text-muted-foreground mb-6">
            Schedule your visit with us today
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => window.location.href = `/signup?org=${slug}`}>
              <Calendar className="mr-2 h-5 w-5" />
              Book Online
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Easy Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Book appointments 24/7 at your convenience
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Professional Care</h3>
            <p className="text-sm text-muted-foreground">
              Experienced team dedicated to your health
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Modern Facility</h3>
            <p className="text-sm text-muted-foreground">
              State-of-the-art equipment and comfortable environment
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-4">Contact Us</h3>
          <p className="text-muted-foreground">
            Get in touch with {organization.name} for more information
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessLanding;