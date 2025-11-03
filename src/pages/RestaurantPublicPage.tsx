import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RestaurantBookingFlow } from '@/components/restaurant/RestaurantBookingFlow';
import { UtensilsCrossed, Clock, ChefHat } from 'lucide-react';

interface RestaurantPublicPageProps {
  business: any;
  services: any[];
}

export default function RestaurantPublicPage({ business, services }: RestaurantPublicPageProps) {
  const [showBooking, setShowBooking] = useState(false);

  // Group services by category (for menu organization)
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(groupedServices);

  if (showBooking) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button 
            variant="outline" 
            onClick={() => setShowBooking(false)}
            className="mb-6"
          >
            ← Back to Menu
          </Button>
          <RestaurantBookingFlow 
            businessId={business.id} 
            businessSlug={business.slug}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-4">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="w-24 h-24 object-contain mx-auto rounded-full"
            />
          )}
          <h1 className="text-4xl md:text-5xl font-bold">{business.name}</h1>
          {business.tagline && (
            <p className="text-xl text-muted-foreground">{business.tagline}</p>
          )}
          {business.bio && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{business.bio}</p>
          )}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => setShowBooking(true)}>
              <UtensilsCrossed className="mr-2 h-5 w-5" />
              Book a Table
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Our Menu</h2>
          <p className="text-muted-foreground">Explore our delicious offerings</p>
        </div>

        {categories.length > 1 ? (
          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedServices[category].map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      {service.image_url && (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <Badge variant="secondary">
                            ${(service.price_cents / 100).toFixed(2)}
                          </Badge>
                        </div>
                        {service.description && (
                          <CardDescription>{service.description}</CardDescription>
                        )}
                      </CardHeader>
                      {service.duration_minutes && (
                        <CardContent>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.duration_minutes} min
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                {service.image_url && (
                  <img 
                    src={service.image_url} 
                    alt={service.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <Badge variant="secondary">
                      ${(service.price_cents / 100).toFixed(2)}
                    </Badge>
                  </div>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                {service.duration_minutes && (
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {service.duration_minutes} min
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <ChefHat className="h-16 w-16 mx-auto text-primary" />
          <h2 className="text-3xl font-bold">Ready to Dine with Us?</h2>
          <p className="text-muted-foreground text-lg">
            Book your table now and experience exceptional dining
          </p>
          <Button size="lg" onClick={() => setShowBooking(true)}>
            Make a Reservation
          </Button>
        </div>
      </div>
    </div>
  );
}
