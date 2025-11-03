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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section with Image */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="ArtBarber Interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="w-32 h-32 mb-6 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
          )}
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            {business.name}
          </h1>
          <p className="text-2xl text-slate-200 mb-8 max-w-2xl drop-shadow-md">
            Professionele Kappersdiensten in het Hart van de Stad
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Di - Zo: 10:00 - 18:30</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-red-500/80 backdrop-blur-sm px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Zonder Afspraak</span>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={scrollToAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Boek Nu
          </Button>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Onze Diensten</h2>
            <p className="text-slate-400 text-lg">Klik op een dienst om te boeken</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <Card 
                key={index}
                className="group bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={scrollToAuth}
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-xl mb-1">{service.name}</CardTitle>
                      <CardDescription className="text-slate-400">{service.description}</CardDescription>
                    </div>
                    <span className="text-green-400 font-bold text-2xl ml-2">{service.price}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{service.duration}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      Boek Nu →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="py-12 bg-slate-800/50 border-y border-slate-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              <h3 className="text-white font-semibold">Locatie</h3>
              <p className="text-slate-400">Te Boelaerpark, Antwerpen</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <h3 className="text-white font-semibold">Openingstijden</h3>
              <p className="text-slate-400">Di - Zo: 10:00 - 18:30</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Phone className="w-8 h-8 text-blue-400" />
              <h3 className="text-white font-semibold">Contact</h3>
              <p className="text-slate-400">Walk-ins welkom!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div ref={authSectionRef} className="container mx-auto px-4 py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Scissors className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Maak een Account</h2>
            <p className="text-slate-400">Meld je aan om je afspraak te boeken bij ArtBarber</p>
          </div>
          
          <Card className="bg-slate-800/70 border-slate-700 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-white">
                Login of Registreer
              </CardTitle>
              <CardDescription className="text-slate-400">
                Kies je dienst en boek direct je afspraak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedAuthForm onSignInSuccess={onAuthSuccess} />
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-slate-400 text-sm">
              ✂️ Walk-ins welcome • 🏆 Professional service • ⚡ Modern techniques
            </p>
            <p className="text-slate-500 text-xs">
              Door een account aan te maken, ga je akkoord met onze voorwaarden
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
