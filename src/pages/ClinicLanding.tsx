import { useNavigate } from 'react-router-dom';
import { useClinicContext } from '@/hooks/useClinicContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

export default function ClinicLanding() {
  const navigate = useNavigate();
  const { clinicInfo, loading, error } = useClinicContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ModernLoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !clinicInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Clinic Not Found</h1>
          <p className="text-muted-foreground">{error || 'This clinic does not exist'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = clinicInfo.primaryColor;
  const secondaryColor = clinicInfo.secondaryColor;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)` }}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {clinicInfo.logoUrl && (
              <img src={clinicInfo.logoUrl} alt={clinicInfo.name} className="h-12 w-12 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>{clinicInfo.name}</h1>
              {clinicInfo.tagline && (
                <p className="text-sm text-muted-foreground">{clinicInfo.tagline}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/${clinicInfo.businessSlug}/signin`)}
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
          Welcome to {clinicInfo.doctorName}'s Practice
        </h2>
        {clinicInfo.specialization && (
          <p className="text-xl text-muted-foreground mb-8">
            Specializing in {clinicInfo.specialization}
          </p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            size="lg"
            onClick={() => navigate(`/${clinicInfo.businessSlug}/onboard`)}
            style={{ backgroundColor: primaryColor }}
            className="text-white hover:opacity-90"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book Appointment
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`/${clinicInfo.businessSlug}/signin`)}
          >
            Patient Portal
          </Button>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Hours */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  {clinicInfo.businessHours && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {Object.entries(clinicInfo.businessHours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {clinicInfo.address && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-sm text-muted-foreground">{clinicInfo.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-1" style={{ color: primaryColor }} />
                <div>
                  <h3 className="font-semibold mb-2">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">
                    Call us to schedule an appointment or for any questions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}