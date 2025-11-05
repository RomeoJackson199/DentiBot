import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Calendar, Phone, Mail, MapPin } from "lucide-react";

interface HomepageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  show_services: boolean;
  show_about: boolean;
  about_title: string;
  about_content: string;
  cta_text: string;
  cta_link: string;
}

interface Business {
  name: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface CustomizableHomepageProps {
  business: Business;
  settings: HomepageSettings;
  services?: any[];
  onCTAClick: () => void;
}

export function CustomizableHomepage({ business, settings, services = [], onCTAClick }: CustomizableHomepageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-10 w-10 object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
            <div>
              <h1 className="text-xl font-bold">{business.name}</h1>
              {business.tagline && <p className="text-sm text-muted-foreground">{business.tagline}</p>}
            </div>
          </div>
          <Button onClick={onCTAClick} size="lg">
            {settings.cta_text}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        {settings.hero_image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${settings.hero_image_url})` }}
          />
        )}
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {settings.hero_title}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            {settings.hero_subtitle}
          </p>
          <Button onClick={onCTAClick} size="lg" className="text-lg px-8 py-6">
            {settings.cta_text}
          </Button>
        </div>
      </section>

      {/* Services Section */}
      {settings.show_services && services.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold text-center mb-12">Nos Prestations</h3>
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1">{service.name}</h4>
                      {service.description && (
                        <p className="text-muted-foreground text-sm">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {service.duration_minutes && (
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {Math.floor(service.duration_minutes / 60) > 0 && `${Math.floor(service.duration_minutes / 60)}h`}
                            {service.duration_minutes % 60 > 0 && ` ${service.duration_minutes % 60}min`}
                          </p>
                        )}
                        {service.price_cents > 0 && (
                          <p className="text-base font-semibold whitespace-nowrap">
                            à partir de {(service.price_cents / 100).toFixed(0)} €
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={onCTAClick}
                        className="whitespace-nowrap"
                        size="default"
                      >
                        Choisir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {settings.show_about && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl font-bold text-center mb-8">{settings.about_title}</h3>
            <div className="prose prose-lg mx-auto text-muted-foreground whitespace-pre-line">
              {settings.about_content}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Book your appointment today and experience quality care
          </p>
          <Button onClick={onCTAClick} size="lg" className="text-lg px-8 py-6">
            {settings.cta_text}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <p className="mt-2 text-sm">Powered by Caberu</p>
        </div>
      </footer>
    </div>
  );
}
