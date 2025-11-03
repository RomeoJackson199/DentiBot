import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { Scissors, Clock, Euro } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCA0MGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={business.name}
                  className="w-24 h-24 mx-auto mb-6 rounded-full object-cover border-4 border-slate-700 shadow-xl"
                />
              )}
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                {business.name}
              </h1>
              {business.tagline && (
                <p className="text-xl text-slate-300 mb-8">{business.tagline}</p>
              )}
              <div className="flex items-center justify-center gap-3 text-slate-300">
                <Scissors className="w-6 h-6" />
                <span className="text-lg">Professional Barbering Services</span>
              </div>
            </div>

            {/* Opening Hours & Pricing Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Opening Hours */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-white">Openingsuren</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">Dinsdag tot Zondag</span>
                    <span className="text-blue-400 font-semibold">10:00 - 18:30</span>
                  </div>
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 font-semibold text-center">Zonder afspraak</p>
                  </div>
                </CardContent>
              </Card>

              {/* Price List */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Euro className="w-5 h-5 text-green-400" />
                    <CardTitle className="text-white">Prijslijst</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { service: "Haar", price: "20€" },
                      { service: "Baard", price: "10€" },
                      { service: "Haar en baard", price: "30€" },
                      { service: "Kinderen", price: "15€" },
                      { service: "Wassen", price: "5€" },
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0"
                      >
                        <span className="text-slate-300 font-medium">{item.service}</span>
                        <span className="text-green-400 font-bold text-lg">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-800/70 border-slate-700 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-white">
                Sign In to Book
              </CardTitle>
              <CardDescription className="text-slate-400">
                Create an account or sign in to book your appointment with {business.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedAuthForm onSignInSuccess={onAuthSuccess} />
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Walk-ins welcome • Professional service • Modern techniques
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
