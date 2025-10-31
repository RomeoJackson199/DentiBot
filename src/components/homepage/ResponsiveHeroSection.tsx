import { ModernHeroSection } from "./ModernHeroSection";
import { ModernHeroSectionMobile } from "./ModernHeroSectionMobile";

type HeroVariant = "default" | "ctaFocused";

interface ResponsiveHeroSectionProps {
        onBookAppointment: () => void;
        onStartTriage: () => void;
        onOpenAIChat?: () => void;
        variant?: HeroVariant;
}

export function ResponsiveHeroSection({ onBookAppointment, onStartTriage, onOpenAIChat, variant = "default" }: ResponsiveHeroSectionProps) {
	return (
		<>
			{/* CSS-driven split ensures no CLS */}
			<div className="only-desktop">
				<ModernHeroSection
					onBookAppointment={onBookAppointment}
					onStartTriage={onStartTriage}
					onOpenAIChat={onOpenAIChat}
					variant={variant}
				/>
			</div>
			<div className="only-mobile">
				<ModernHeroSectionMobile
					onBookAppointment={onBookAppointment}
					onStartTriage={onStartTriage}
					variant={variant}
				/>
			</div>
		</>
	);
}