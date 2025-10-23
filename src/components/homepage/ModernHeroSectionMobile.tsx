import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Sparkles, ArrowRight, Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ModernHeroSectionMobileProps {
	onBookAppointment: () => void;
	onStartTriage: () => void;
	minimal?: boolean;
}

export function ModernHeroSectionMobile({ onBookAppointment, onStartTriage, minimal = false }: ModernHeroSectionMobileProps) {
	const { t, language } = useLanguage();

	return (
		<section className="relative min-h-screen flex overflow-hidden only-mobile bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90" />
			
			<div className="container mx-auto px-4 relative z-10 flex flex-col justify-between py-8 text-white">
				<div className="flex items-center gap-2 text-xs font-medium">
					<Shield className="h-4 w-4" />
					{language === 'fr' ? '10 000+ patients' : language === 'nl' ? '10.000+ patiënten' : '10,000+ patients'}
				</div>

				<div className="space-y-6">
					<div>
						<h1 className="text-4xl font-bold leading-tight mb-4">
							{language === 'fr' ? 'VOS SOINS DENTAIRES' : language === 'nl' ? 'UW TANDVERZORGING' : 'YOUR DENTAL CARE'}
							<br />
							<span className="text-white/90">
								{language === 'fr' ? 'SIMPLIFIÉS' : language === 'nl' ? 'VEREENVOUDIGD' : 'SIMPLIFIED'}
							</span>
						</h1>
					</div>

					<div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
								<Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
							</div>
							<div>
								<p className="text-white/95 mb-2 text-sm leading-relaxed">
									{language === 'fr' ? "DentiBot a transformé ma gestion de rendez-vous!" : language === 'nl' ? 'DentiBot heeft mijn afspraakbeheer getransformeerd!' : "DentiBot transformed my appointment management!"}
								</p>
								<p className="text-sm font-semibold">{language === 'fr' ? 'Sophie M.' : language === 'nl' ? 'Jan J.' : 'Sarah J.'}</p>
							</div>
						</div>
					</div>

					{!minimal && (
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

					{!minimal && (
						<div className="space-y-3 pt-2">
							<AppButton
								variant="outline"
								size="mobile"
								onClick={onBookAppointment}
								className="w-full bg-white text-primary hover:bg-white/90 border-0 h-12"
							>
								<Calendar className="h-5 w-5 mr-2" />
								{t.bookAppointment}
							</AppButton>

							<AppButton
								variant="outline"
								size="mobile"
								onClick={onStartTriage}
								className="w-full border-white/30 hover:bg-white/10 text-white h-12"
							>
								<Shield className="h-5 w-5 mr-2" />
								{t['triage.title']}
							</AppButton>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}