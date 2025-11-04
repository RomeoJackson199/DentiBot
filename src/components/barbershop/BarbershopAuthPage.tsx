/**
 * BarbershopAuthPage - Example Reference Implementation
 *
 * This is a custom landing page specifically designed for ART Barber in Tervuren.
 * It serves as a REFERENCE EXAMPLE of what's possible with custom styling.
 *
 * For most businesses, we recommend using CustomizableHomepage component instead,
 * which can be configured through the admin panel without code changes.
 *
 * This example demonstrates:
 * - Custom branding with specific colors (#d4af37 gold accent)
 * - Multilingual support (Dutch)
 * - Service showcase with images
 * - Responsive design
 * - Call-to-action flows
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImprovedAuthForm } from "@/components/auth/ImprovedAuthForm";
import { Scissors, Clock, Euro, Calendar, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/barbershop-hero.jpg";
import haircutImage from "@/assets/service-haircut.jpg";
import beardImage from "@/assets/service-beard.jpg";
import kidsImage from "@/assets/service-kids.jpg";
import logoImage from "@/assets/artbarber-logo.jpg";
import haircutFade from "@/assets/haircut-fade.jpg";
import haircutKidsStyle from "@/assets/haircut-kids-style.jpg";
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
      image: haircutFade,
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
      image: haircutKidsStyle,
      duration: "20 min"
    },
    { 
      name: "Wassen", 
      price: "5€", 
      description: "Haarverzorging met premium producten",
      image: haircutFade,
      duration: "10 min"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src={logoImage} alt="ART Barber" className="h-16 w-auto" />
          <div className="hidden md:flex items-center gap-8 text-white/90">
            <a href="#services" className="hover:text-[#d4af37] transition-colors font-light">Diensten</a>
            <a href="#about" className="hover:text-[#d4af37] transition-colors font-light">Over Ons</a>
            <a href="#contact" className="hover:text-[#d4af37] transition-colors font-light">Contact</a>
            <Button 
              onClick={scrollToAuth}
              className="bg-white text-black hover:bg-[#d4af37] hover:text-black transition-all font-semibold px-6"
            >
              Boek Nu
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="ArtBarber" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
        </div>
        
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-start text-left max-w-4xl pt-20">
          <div className="mb-6 text-[#d4af37] text-sm tracking-[0.3em] uppercase font-light animate-fade-in">
            Klassieke Barbier sinds 2020
          </div>
          <h1 className="text-6xl md:text-8xl font-serif text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Welkom bij<br />
            <span className="text-[#d4af37]">ART Barber</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Combineren van klassieke technieken met moderne stijl.<br />
            Ervaar de perfecte knipbeurt, speciaal voor jou op maat gemaakt.
          </p>
          <div className="flex gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg"
              onClick={scrollToAuth}
              className="bg-white text-black hover:bg-[#d4af37] hover:text-black px-8 py-6 text-lg font-semibold transition-all"
            >
              Boek Afspraak
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={scrollToAuth}
              className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg font-semibold transition-all"
            >
              Meer Info
            </Button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <div className="text-[#d4af37] text-sm tracking-[0.3em] uppercase font-light mb-4">
                Klassiek
              </div>
              <h2 className="text-5xl md:text-6xl font-serif text-black mb-8 leading-tight">
                Ervaar de Beste<br />Barbier in Tervuren
              </h2>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Bij ART Barber combineren we traditie met moderne stijl. Onze ervaren barbiers bieden uitzonderlijke service die afgestemd is op jouw behoeften.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-black mb-3">Expert Barbiers</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Onze professionele barbiers zorgen voor precisie knipbeurten en persoonlijke verzorgingservaringen.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-black mb-3">Premium Producten</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We gebruiken alleen de beste producten om je look te verbeteren en gezond haar te behouden.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  size="lg"
                  onClick={scrollToAuth}
                  className="bg-black text-white hover:bg-[#d4af37] hover:text-black px-8 py-6 text-lg font-semibold transition-all"
                >
                  Boek Nu
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={scrollToAuth}
                  className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-6 text-lg font-semibold transition-all"
                >
                  Meer Info →
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={haircutImage} 
                alt="Professional Barbering" 
                className="w-full h-[600px] object-cover shadow-2xl"
              />
              <div className="absolute -bottom-8 -left-8 bg-[#d4af37] text-black p-8 shadow-2xl">
                <div className="text-5xl font-bold mb-2">4+</div>
                <div className="text-sm tracking-wider uppercase">Jaren Ervaring</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="py-32 bg-[#0a0a0a] relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="text-[#d4af37] text-sm tracking-[0.3em] uppercase font-light mb-4">
              Onze Diensten
            </div>
            <h2 className="text-5xl md:text-6xl font-serif text-white mb-4">
              Premium Barbier Services
            </h2>
            <p className="text-white/60 text-xl">Klik op een dienst om direct te boeken</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="group cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500 overflow-hidden"
                onClick={scrollToAuth}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-white text-2xl font-semibold mb-1">{service.name}</h3>
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{service.duration}</span>
                        </div>
                      </div>
                      <div className="text-[#d4af37] text-3xl font-bold">
                        {service.price}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-white/70 mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center text-[#d4af37] group-hover:translate-x-2 transition-transform">
                    <span className="font-semibold">Boek Nu</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div id="contact" className="py-24 bg-[#111111] border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4af37]/10 rounded-full mb-6 group-hover:bg-[#d4af37]/20 transition-colors">
                <MapPin className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Locatie</h3>
              <p className="text-white/60 text-lg">Tervuren, België</p>
              <p className="text-white/40 text-sm mt-2">Premium Barbershop</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4af37]/10 rounded-full mb-6 group-hover:bg-[#d4af37]/20 transition-colors">
                <Clock className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Openingstijden</h3>
              <p className="text-white/60 text-lg">Di - Zo: 10:00 - 18:30</p>
              <p className="text-white/40 text-sm mt-2">Maandag Gesloten</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4af37]/10 rounded-full mb-6 group-hover:bg-[#d4af37]/20 transition-colors">
                <Star className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Service</h3>
              <p className="text-white/60 text-lg">Walk-ins Welkom</p>
              <p className="text-white/40 text-sm mt-2">Of Boek Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div ref={authSectionRef} className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#d4af37]/10 rounded-full mb-6">
                <Scissors className="w-10 h-10 text-[#d4af37]" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-black mb-4">
                Boek Je Afspraak
              </h2>
              <p className="text-gray-600 text-lg">
                Maak een account aan om je afspraak bij ART Barber te boeken
              </p>
            </div>
            
            <Card className="bg-white shadow-2xl border-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4af37] to-black"></div>
              <CardHeader className="text-center space-y-3 pt-10 pb-6">
                <CardTitle className="text-2xl text-black font-semibold">
                  Login of Registreer
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Kies je dienst en boek direct je afspraak
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-10 px-8">
                <ImprovedAuthForm onSignInSuccess={onAuthSuccess} />
              </CardContent>
            </Card>
            
            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-8 text-gray-600">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm font-medium">Walk-ins Welkom</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm font-medium">Premium Service</span>
                </div>
              </div>
              <p className="text-gray-500 text-xs max-w-md mx-auto">
                Door een account aan te maken, ga je akkoord met onze algemene voorwaarden
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <img src={logoImage} alt="ART Barber" className="h-16 w-auto mx-auto mb-6 opacity-80" />
          <p className="text-white/60 text-sm">
            © 2024 ART Barber Shop Tervuren. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
};
