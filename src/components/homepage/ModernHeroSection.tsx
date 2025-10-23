import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Calendar, 
  Shield, 
  Zap, 
  Users, 
  Brain,
  Heart,
  Star,
  ArrowRight,
  Play
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ModernHeroSectionProps {
  onBookAppointment: () => void;
  onStartTriage: () => void;
  onOpenAIChat?: () => void;
  minimal?: boolean;
}

export function ModernHeroSection({ onBookAppointment, onStartTriage, onOpenAIChat, minimal = false }: ModernHeroSectionProps) {
  const { t, language } = useLanguage();

  return (
    <section className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
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

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md border border-white/20">
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
          </div>

          {!minimal && (
            <div className="grid grid-cols-2 gap-4 max-w-md">
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
            </div>
          )}

          {!minimal && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <AppButton
                variant="outline"
                size="desktop"
                asChild
                className="bg-white text-primary hover:bg-white/90 border-0 min-w-[200px] h-12"
              >
                <a href="/book" className="flex items-center justify-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t.bookAppointment}
                </a>
              </AppButton>
              
              <AppButton
                variant="outline"
                size="desktop"
                onClick={onStartTriage}
                className="border-white/30 hover:bg-white/10 text-white min-w-[200px] h-12"
              >
                <Shield className="h-5 w-5 mr-2" />
                {t['triage.title']}
              </AppButton>

              {onOpenAIChat && (
                <AppButton
                  variant="outline"
                  size="desktop"
                  onClick={onOpenAIChat}
                  className="border-white/30 hover:bg-white/10 text-white min-w-[200px] h-12"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  {language === 'fr' ? "Parler à l'IA" : language === 'nl' ? 'Praat met AI' : 'Talk to AI'}
                </AppButton>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}