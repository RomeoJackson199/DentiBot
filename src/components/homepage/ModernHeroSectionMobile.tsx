import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ModernHeroSectionMobileProps {
	onBookAppointment: () => void;
	onStartTriage: () => void;
	minimal?: boolean;
}

export function ModernHeroSectionMobile({ onBookAppointment, onStartTriage, minimal = false }: ModernHeroSectionMobileProps) {
	const { t, language } = useLanguage();

	return (
		<section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden only-mobile">
			<div className="absolute inset-0 hero-pattern">
				<div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="max-w-md mx-auto text-center space-y-8 animate-mobile-slide-up">
					<div className="animate-fade-in">
						<Badge variant="secondary" className="bg-gradient-primary text-white px-4 py-1.5 text-mobile-sm rounded-full shadow-glow">
							<Sparkles className="h-4 w-4 mr-2" />
							{language === 'fr' ? 'IA avancée' : language === 'nl' ? 'Geavanceerde AI' : 'Advanced AI'}
						</Badge>
					</div>

					<div className="space-y-3 animate-slide-up">
						<h1 className="text-4xl font-bold leading-tight">
							<span className="gradient-text">{language === 'fr' ? 'Soin dentaire' : language === 'nl' ? 'Tandzorg' : 'Dental Care'}</span>
							<br />
							<span className="text-foreground">{language === 'fr' ? 'simplifié' : language === 'nl' ? 'eenvoudig' : 'Simplified'}</span>
						</h1>
						<p className="text-mobile-lg text-muted-foreground leading-relaxed">
							{t.experienceFuture}
						</p>
					</div>

					{!minimal && (
						<div className="space-y-3">
							<AppButton
								variant="gradient"
								size="mobile"
								onClick={onBookAppointment}
								aria-label="Book a dental appointment"
								className="w-full btn-elevated"
							>
								<Calendar className="h-5 w-5 mr-2" />
								{t.bookAppointment}
								<ArrowRight className="h-4 w-4 ml-2" />
							</AppButton>

							<AppButton
								variant="outline"
								size="mobile"
								onClick={onStartTriage}
								aria-label="Start emergency dental triage"
								className="w-full border-dental-primary/30 hover:bg-dental-primary/5"
							>
								<Shield className="h-5 w-5 mr-2" />
								{t['triage.title']}
							</AppButton>
						</div>
					)}

					{!minimal && (
						<div className="grid grid-cols-2 gap-3 pt-4">
							<Card variant="glass" className="p-3 text-left">
								<p className="text-mobile-sm text-dental-muted-foreground">{language === 'fr' ? 'Assistance 24/7' : language === 'nl' ? '24/7 ondersteuning' : '24/7 Support'}</p>
							</Card>
							<Card variant="glass" className="p-3 text-left">
								<p className="text-mobile-sm text-dental-muted-foreground">{language === 'fr' ? 'Réservations rapides' : language === 'nl' ? 'Snelle boekingen' : 'Fast Booking'}</p>
							</Card>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}