import { ModernHeroSection } from "./ModernHeroSection";
import { ModernHeroSectionMobile } from "./ModernHeroSectionMobile";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveHeroSectionProps {
	onBookAppointment: () => void;
	onStartTriage: () => void;
	onOpenAIChat?: () => void;
	minimal?: boolean;
}

export function ResponsiveHeroSection({ onBookAppointment, onStartTriage, onOpenAIChat, minimal }: ResponsiveHeroSectionProps) {
	const isMobile = useIsMobile();

	return (
		<>
			{/* CSS-driven split ensures no CLS; hook provides SSR-safe fallback */}
			<div className="only-desktop">
				<ModernHeroSection
					onBookAppointment={onBookAppointment}
					onStartTriage={onStartTriage}
					onOpenAIChat={onOpenAIChat}
					minimal={minimal}
				/>
			</div>
			<div className="only-mobile">
				<ModernHeroSectionMobile
					onBookAppointment={onBookAppointment}
					onStartTriage={onStartTriage}
					minimal={minimal}
				/>
			</div>

			{/* Runtime fallback: if hook says mobile, prefer mobile component */}
			{isMobile && (
				<div className="hidden">
					<ModernHeroSectionMobile onBookAppointment={onBookAppointment} onStartTriage={onStartTriage} minimal={minimal} />
				</div>
			)}
		</>
	);
}