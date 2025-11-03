import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { Scissors, Clock, Euro, Calendar, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/barbershop-hero.jpg";
import haircutImage from "@/assets/service-haircut.jpg";
import beardImage from "@/assets/service-beard.jpg";
import kidsImage from "@/assets/service-kids.jpg";
import { useRef } from "react";

interface BarbershopAuthPageProps {
  business: {
    id: string;
    name: string;
    logo_url?: string;
    tagline?: string;
  };
  onAuthSuccess: () => void;
}

export const BarbershopAuthPage = ({ business, onAuthSuccess }: BarbershopAuthPageProps) => {
  const authSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = () => {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const services = [
    { 
      name: "Haar", 
      price: "20€", 
      description: "Professionele knipbeurt met stijladvies",
      image: haircutImage,
      duration: "30 min"
    },
    { 
      name: "Baard", 
      price: "10€", 
      description: "Precisie trimmen en vormgeven",
      image: beardImage,
      duration: "15 min"
    },
    { 
      name: "Haar en baard", 
      price: "30€", 
      description: "Complete verzorging pakket",
      image: haircutImage,
      duration: "45 min"
    },
    { 
      name: "Kinderen", 
      price: "15€", 
      description: "Kindvriendelijke knipbeurt",
      image: kidsImage,
      duration: "20 min"
    },
    { 
      name: "Wassen", 
      price: "5€", 
      description: "Haarverzorging met premium producten",
      image: haircutImage,
      duration: "10 min"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section with Image */}
      <div className="relative h-[80vh] min-h-[600px] overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="ArtBarber Interior" 
            className="w-full h-full object-cover scale-105 animate-float"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background"></div>
          <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        </div>
        
        {/* Animated Glow Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }}></div>
        
        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center">
          {business.logo_url && (
            <div className="relative mb-8 animate-scale-in">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
              <img 
                src={business.logo_url} 
                alt={business.name}
                className="relative w-36 h-36 rounded-full object-cover border-4 border-primary/30 shadow-elegant backdrop-blur-sm"
              />
            </div>
          )}
          <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-6 tracking-tight animate-fade-in bg-gradient-primary bg-clip-text text-transparent">
            {business.name}
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-10 max-w-3xl animate-fade-in font-light" style={{ animationDelay: '0.1s' }}>
            Professionele Kappersdiensten in het Hart van de Stad
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card flex items-center gap-3 px-6 py-3 rounded-full hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Di - Zo: 10:00 - 18:30</span>
            </div>
            <div className="flex items-center gap-3 bg-destructive/90 backdrop-blur-sm px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-glow">
              <Calendar className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">Zonder Afspraak</span>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={scrollToAuth}
            className="btn-glow bg-gradient-primary hover:shadow-glow text-white px-10 py-7 text-xl font-bold rounded-full shadow-elegant hover:scale-105 transition-all duration-300 animate-fade-in border-2 border-primary/20"
            style={{ animationDelay: '0.3s' }}
          >
            <Calendar className="w-6 h-6 mr-2" />
            Boek Nu
          </Button>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-gradient-to-b from-background to-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4">
              <Scissors className="w-12 h-12 text-primary mx-auto animate-bounce-gentle" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Onze Diensten
            </h2>
            <p className="text-muted-foreground text-xl">Klik op een dienst om te boeken</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="floating-card group cursor-pointer animate-fade-in"
                onClick={scrollToAuth}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold text-2xl px-4 py-2 rounded-full shadow-glow">
                    {service.price}
                  </div>
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-foreground text-2xl flex items-center gap-2 group-hover:text-primary transition-colors">
                    {service.name}
                    <Euro className="w-5 h-5" />
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium">{service.duration}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10 font-semibold group-hover:translate-x-1 transition-transform"
                    >
                      Boek Nu →
                    </Button>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="py-16 bg-muted/30 border-y border-border/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
            <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 hover:scale-105 transition-transform animate-fade-in group">
              <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-foreground font-bold text-xl">Locatie</h3>
              <p className="text-muted-foreground text-lg">Te Boelaerpark, Antwerpen</p>
            </div>
            <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 hover:scale-105 transition-transform animate-fade-in group" style={{ animationDelay: '0.1s' }}>
              <div className="p-4 bg-secondary/10 rounded-full group-hover:bg-secondary/20 transition-colors">
                <Clock className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-foreground font-bold text-xl">Openingstijden</h3>
              <p className="text-muted-foreground text-lg">Di - Zo: 10:00 - 18:30</p>
            </div>
            <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4 hover:scale-105 transition-transform animate-fade-in group" style={{ animationDelay: '0.2s' }}>
              <div className="p-4 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                <Phone className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-foreground font-bold text-xl">Contact</h3>
              <p className="text-muted-foreground text-lg">Walk-ins welkom!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div ref={authSectionRef} className="container mx-auto px-4 py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-lg mx-auto relative">
          <div className="text-center mb-10 animate-fade-in">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative p-4 bg-gradient-primary rounded-full shadow-glow">
                <Scissors className="w-14 h-14 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Maak een Account
            </h2>
            <p className="text-muted-foreground text-lg">
              Meld je aan om je afspraak te boeken bij {business.name}
            </p>
          </div>
          
          <Card className="floating-card bg-card/80 backdrop-blur-2xl shadow-elegant border-2 border-border/50 overflow-hidden animate-scale-in">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary"></div>
            <CardHeader className="text-center space-y-3 pt-8">
              <CardTitle className="text-3xl text-foreground font-bold">
                Login of Registreer
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                Kies je dienst en boek direct je afspraak
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <UnifiedAuthForm onSignInSuccess={onAuthSuccess} />
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Walk-ins welkom</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium">Professioneel</span>
              </div>
            </div>
            <p className="text-muted-foreground/70 text-xs max-w-md mx-auto">
              Door een account aan te maken, ga je akkoord met onze voorwaarden
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
