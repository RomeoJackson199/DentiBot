import { ModernHeroSection } from "./ModernHeroSection";
import { ModernHeroSectionMobile } from "./ModernHeroSectionMobile";
import { useIsMobile } from "@/hooks/use-mobile";

type HeroVariant = "default" | "ctaFocused";

interface ResponsiveHeroSectionProps {
        onBookAppointment: () => void;
        onStartTriage: () => void;
        onOpenAIChat?: () => void;
        variant?: HeroVariant;
}

export function ResponsiveHeroSection({ onBookAppointment, onStartTriage, onOpenAIChat, variant = "default" }: ResponsiveHeroSectionProps) {
        const isMobile = useIsMobile();

        return (
                <>
			{/* CSS-driven split ensures no CLS; hook provides SSR-safe fallback */}
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

                        {/* Runtime fallback: if hook says mobile, prefer mobile component */}
                        {isMobile && (
                                <div className="hidden">
                                        <ModernHeroSectionMobile onBookAppointment={onBookAppointment} onStartTriage={onStartTriage} variant={variant} />
                                </div>
                        )}
                </>
        );
}