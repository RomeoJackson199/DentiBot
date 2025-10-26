import { AppButton } from "@/components/ui/AppButton";
import { Calendar, Shield, Users, Brain, Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
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
  const isCtaFocused = variant === "ctaFocused";
  return <section className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90" />

      <div className="container mx-auto px-8 lg:px-12 relative z-10 flex flex-col justify-between py-12 text-white">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-5 w-5" />
          {language === 'fr' ? 'Plus de 10 000 patients gèrent leur santé dentaire' : language === 'nl' ? 'Meer dan 10.000 patiënten beheren hun tandgezondheid' : 'Join 10,000+ patients managing their dental health'}
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-4">
              {language === 'fr' ? 'VOS SOINS DENTAIRES' : language === 'nl' ? 'UW TANDVERZORGING' : 'YOUR DENTAL CARE'}
              <br />
              <span className="text-white/90">
                {language === 'fr' ? 'SIMPLIFIÉS' : language === 'nl' ? 'VEREENVOUDIGD' : 'SIMPLIFIED'}
              </span>
            </h1>
          </div>

          {isCtaFocused ? <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md border border-white/10">
              <div className="flex items-center gap-3 text-sm text-white/90">
                <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                {language === 'fr' ? 'Des milliers de patients prennent soin de leur sourire avec DentiBot' : language === 'nl' ? 'Duizenden patiënten verzorgen hun glimlach met DentiBot' : 'Thousands of patients trust DentiBot with their smile'}
              </div>
            </div> : <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <p className="text-white/95 mb-3 leading-relaxed">
                    {language === 'fr' ? "DentiBot a complètement transformé ma gestion des rendez-vous dentaires. L'assistant IA est incroyablement utile!" : language === 'nl' ? 'DentiBot heeft mijn tandheelkundige afspraakbeheer volledig getransformeerd. De AI-assistent is ongelooflijk behulpzaam!' : "DentiBot has completely transformed how I manage my dental appointments. The AI assistant is incredibly helpful!"}
                  </p>
                  <p className="font-semibold">{language === 'fr' ? 'Sophie Martin' : language === 'nl' ? 'Jan Janssen' : 'Sarah Johnson'}</p>
                  <p className="text-sm text-white/70">{language === 'fr' ? 'Patiente régulière' : language === 'nl' ? 'Reguliere Patiënt' : 'Regular Patient'}</p>
                </div>
              </div>
            </div>}

          {!isCtaFocused && <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <Brain className="h-6 w-6 mb-2" />
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-white/80">
                  {language === 'fr' ? 'Assistance IA' : language === 'nl' ? 'AI Ondersteuning' : 'AI Support'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <Shield className="h-6 w-6 mb-2" />
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-white/80">
                  {language === 'fr' ? 'Sécurisé et privé' : language === 'nl' ? 'Veilig & Privé' : 'Secure & Private'}
                </p>
              </div>
            </div>}

          <div className="max-w-md space-y-4">
            <AppButton variant="gradient" size="lg" onClick={onOpenAIChat} className="w-full bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl border-0 h-16 text-lg font-semibold group">
              <Brain className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
              {language === 'fr' ? '✨ Commencer avec l\'IA' : language === 'nl' ? '✨ Begin met AI' : '✨ Start with AI Assistant'}
            </AppButton>
            
            <AppButton 
              variant="outline" 
              size="lg" 
              onClick={() => window.location.href = '/signup'}
              className="w-full bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 h-14 text-base font-semibold"
            >
              <Users className="h-5 w-5 mr-2" />
              {language === 'fr' ? '🏥 Créer Votre Clinique' : language === 'nl' ? '🏥 Maak Uw Kliniek' : '🏥 Create Your Business'}
            </AppButton>
          </div>
        </div>
      </div>
    </section>;
}