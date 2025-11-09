import { AppButton } from "@/components/ui/AppButton";
import { Calendar, Shield, Users, Brain, Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
type HeroVariant = "default" | "ctaFocused";
interface ModernHeroSectionProps {
  onBookAppointment: () => void;
  onStartTriage: () => void;
  onOpenAIChat?: () => void;
  variant?: HeroVariant;
}
export function ModernHeroSection({
  onBookAppointment,
  onStartTriage,
  onOpenAIChat,
  variant = "default"
}: ModernHeroSectionProps) {
  const {
    t,
    language
  } = useLanguage();
  const navigate = useNavigate();
  const isCtaFocused = variant === "ctaFocused";
  return <section className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90" />

      <div className="container mx-auto px-16 xl:px-24 relative z-10 flex flex-col justify-between py-16 text-white max-w-7xl">
        <div className="flex items-center gap-3 text-base font-medium">
          <Users className="h-6 w-6" />
          {language === 'fr' ? 'Plus de 10 000 utilisateurs font confiance à notre plateforme' : language === 'nl' ? 'Meer dan 10.000 gebruikers vertrouwen op ons platform' : 'Join 10,000+ users managing their business'}
        </div>

        <div className="space-y-12 max-w-2xl">
          <div>
            <h1 className="text-7xl xl:text-8xl font-bold leading-tight mb-6">
              {language === 'fr' ? 'VOTRE ENTREPRISE' : language === 'nl' ? 'UW BEDRIJF' : 'YOUR BUSINESS'}
              <br />
              <span className="text-white/90">
                {language === 'fr' ? 'SIMPLIFIÉE' : language === 'nl' ? 'VEREENVOUDIGD' : 'SIMPLIFIED'}
              </span>
            </h1>
          </div>

          {isCtaFocused ? <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-4 text-lg text-white/90">
                <Star className="h-7 w-7 text-yellow-300 fill-yellow-300" />
                {language === 'fr' ? 'Des milliers d\'entreprises transforment leur gestion avec notre IA' : language === 'nl' ? 'Duizenden bedrijven transformeren hun beheer met onze AI' : 'Thousands of businesses trust our AI platform'}
              </div>
            </div> : <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="h-7 w-7 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <p className="text-white/95 mb-4 leading-relaxed text-lg">
                    {language === 'fr' ? "Cette plateforme a complètement transformé la gestion de mon entreprise. L'assistant IA est incroyablement utile!" : language === 'nl' ? 'Dit platform heeft mijn bedrijfsbeheer volledig getransformeerd. De AI-assistent is ongelooflijk behulpzaam!' : "This platform has completely transformed how I manage my business. The AI assistant is incredibly helpful!"}
                  </p>
                  <p className="font-semibold text-lg">{language === 'fr' ? 'Sophie Martin' : language === 'nl' ? 'Jan Janssen' : 'Sarah Johnson'}</p>
                  <p className="text-base text-white/70">{language === 'fr' ? 'Propriétaire d\'entreprise' : language === 'nl' ? 'Bedrijfseigenaar' : 'Business Owner'}</p>
                </div>
              </div>
            </div>}

          {!isCtaFocused && <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <Brain className="h-8 w-8 mb-3" />
                <p className="text-3xl font-bold mb-1">24/7</p>
                <p className="text-base text-white/80">
                  {language === 'fr' ? 'Assistance IA' : language === 'nl' ? 'AI Ondersteuning' : 'AI Support'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <Shield className="h-8 w-8 mb-3" />
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-base text-white/80">
                  {language === 'fr' ? 'Sécurisé et privé' : language === 'nl' ? 'Veilig & Privé' : 'Secure & Private'}
                </p>
              </div>
            </div>}

          <div className="space-y-5">
            <AppButton variant="gradient" size="lg" onClick={onOpenAIChat} className="w-full bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl border-0 h-20 text-xl font-semibold group">
              <Brain className="h-7 w-7 mr-3 group-hover:rotate-12 transition-transform" />
              {language === 'fr' ? '✨ Commencer avec l\'IA' : language === 'nl' ? '✨ Begin met AI' : '✨ Start with AI Assistant'}
            </AppButton>
            
            <AppButton
              variant="outline"
              size="lg"
              onClick={() => navigate('/signup')}
              className="w-full bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 h-16 text-lg font-semibold"
            >
              <Users className="h-6 w-6 mr-2" />
              {language === 'fr' ? '🏥 Créer Votre Clinique' : language === 'nl' ? '🏥 Maak Uw Kliniek' : '🏥 Create Your Business'}
            </AppButton>
          </div>
        </div>
      </div>
    </section>;
}