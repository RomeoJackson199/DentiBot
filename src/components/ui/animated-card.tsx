import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  glow?: boolean;
  hover?: boolean;
}

export const AnimatedCard = ({ 
  children, 
  className, 
  gradient = false,
  glow = false,
  hover = true
}: AnimatedCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all duration-300",
        gradient ? "bg-gradient-card" : "bg-card",
        glow && "shadow-glow",
        hover && "hover:shadow-elegant hover:scale-[1.02]",
        "backdrop-blur-sm border-border/50",
        className
      )}
    >
      {glow && (
        <div className="absolute inset-0 rounded-lg bg-gradient-primary opacity-5 pointer-events-none" />
      )}
      {children}
    </div>
  );
};
