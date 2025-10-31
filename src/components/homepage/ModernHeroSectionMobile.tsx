import { AppButton } from "@/components/ui/AppButton";
import { Calendar, Shield, Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type HeroVariant = "default" | "ctaFocused";

interface ModernHeroSectionMobileProps {
        onBookAppointment: () => void;
        onStartTriage: () => void;
        variant?: HeroVariant;
}

export function ModernHeroSectionMobile({ onBookAppointment, onStartTriage, variant = "default" }: ModernHeroSectionMobileProps) {
        const { t, language } = useLanguage();
        const isCtaFocused = variant === "ctaFocused";

	return (
		<section className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90" />
			
			<div className="container mx-auto px-4 relative z-10 flex flex-col justify-between py-8 text-white">
				<div className="flex items-center gap-2 text-xs font-medium">
					<Shield className="h-4 w-4" />
					{language === 'fr' ? '10 000+ utilisateurs' : language === 'nl' ? '10.000+ gebruikers' : '10,000+ users'}
				</div>

				<div className="space-y-6">
					<div>
						<h1 className="text-4xl font-bold leading-tight mb-4">
							{language === 'fr' ? 'VOTRE ENTREPRISE' : language === 'nl' ? 'UW BEDRIJF' : 'YOUR BUSINESS'}
							<br />
							<span className="text-white/90">
								{language === 'fr' ? 'SIMPLIFIÉE' : language === 'nl' ? 'VEREENVOUDIGD' : 'SIMPLIFIED'}
							</span>
						</h1>
					</div>

                                        {isCtaFocused ? (
                                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                                        <div className="flex items-center gap-2 text-xs text-white/90">
                                                                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                                                                {language === 'fr'
                                                                        ? 'Des milliers d\'entreprises font confiance à notre plateforme'
                                                                        : language === 'nl'
                                                                                ? 'Duizenden bedrijven vertrouwen op ons platform'
                                                                                : 'Thousands of businesses trust our platform'}
                                                        </div>
                                                </div>
                                        ) : (
                                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                                        <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                                        <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                                                                </div>
                                                                <div>
                                                                        <p className="text-white/95 mb-2 text-sm leading-relaxed">
                                                                                {language === 'fr' ? "Cette plateforme a transformé la gestion de mon entreprise!" : language === 'nl' ? 'Dit platform heeft mijn bedrijfsbeheer getransformeerd!' : "This platform transformed my business management!"}
                                                                        </p>
                                                                        <p className="text-sm font-semibold">{language === 'fr' ? 'Sophie M.' : language === 'nl' ? 'Jan J.' : 'Sarah J.'}</p>
                                                                </div>
                                                        </div>
                                                </div>
                                        )}

                                        {!isCtaFocused && (
                                                <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                                                <Calendar className="h-5 w-5 mb-1" />
								<p className="text-xl font-bold">24/7</p>
								<p className="text-xs text-white/80">
									{language === 'fr' ? 'Support' : language === 'nl' ? 'Ondersteuning' : 'Support'}
								</p>
							</div>
							<div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
								<Shield className="h-5 w-5 mb-1" />
								<p className="text-xl font-bold">100%</p>
								<p className="text-xs text-white/80">
									{language === 'fr' ? 'Sécurisé' : language === 'nl' ? 'Veilig' : 'Secure'}
								</p>
							</div>
						</div>
					)}

                                        <div className="space-y-3 pt-2">
                                                <AppButton
                                                        variant="gradient"
                                                        size="mobile"
                                                        onClick={() => window.location.href = '/chat'}
                                                        className="w-full bg-white text-primary hover:bg-white/90 border-0 h-14 text-base font-semibold group"
                                                >
                                                        <Star className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                                                        {language === 'fr' ? '✨ Commencer avec l\'IA' : language === 'nl' ? '✨ Begin met AI' : '✨ Start with AI'}
                                                </AppButton>
                                                <p className="text-xs text-white/90 text-center mt-2">
                                                        {language === 'fr' ? 'Rapide. Intelligent. Disponible 24/7.' : language === 'nl' ? 'Snel. Slim. 24/7 beschikbaar.' : 'Smart. Fast. Available 24/7.'}
                                                </p>

                                                <AppButton
                                                        variant="outline"
                                                        size="mobile"
                                                        onClick={() => window.location.href = '/signup'}
                                                        className="w-full bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 text-white h-12 mt-2"
                                                >
                                                        <Shield className="h-5 w-5 mr-2" />
                                                        {language === 'fr' ? '🏥 Créer Votre Clinique' : language === 'nl' ? '🏥 Maak Uw Kliniek' : '🏥 Create Your Business'}
                                                </AppButton>

                                                <AppButton
                                                        variant="outline"
                                                        size="mobile"
                                                        onClick={onStartTriage}
                                                        className="w-full border-white/30 hover:bg-white/10 text-white h-11 mt-2"
                                                >
                                                        <Shield className="h-5 w-5 mr-2" />
                                                        {t['triage.title']}
                                                </AppButton>
                                        </div>
                                </div>
                        </div>
                </section>
        );
}