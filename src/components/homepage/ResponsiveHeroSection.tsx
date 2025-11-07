import { ModernHeroSection } from "./ModernHeroSection";

type HeroVariant = "default" | "ctaFocused";

interface ResponsiveHeroSectionProps {
        onBookAppointment: () => void;
        onStartTriage: () => void;
        onOpenAIChat?: () => void;
        variant?: HeroVariant;
}

export function ResponsiveHeroSection({ onBookAppointment, onStartTriage, onOpenAIChat, variant = "default" }: ResponsiveHeroSectionProps) {
	return (
		<ModernHeroSection
			onBookAppointment={onBookAppointment}
			onStartTriage={onStartTriage}
			onOpenAIChat={onOpenAIChat}
			variant={variant}
		/>
	);
}