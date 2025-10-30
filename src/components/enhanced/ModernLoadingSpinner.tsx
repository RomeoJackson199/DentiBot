import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart, Sparkles } from "lucide-react";

interface ModernLoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "card" | "overlay" | "minimal";
  message?: string;
  description?: string;
}

export function ModernLoadingSpinner({ 
  size = "md", 
  variant = "default",
  message = "Loading...",
  description
}: ModernLoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const haloSizes = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  } as const;

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  const LoadingContent = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative flex items-center justify-center">
        <span
          className={`relative flex items-center justify-center rounded-full ${haloSizes[size]} bg-gradient-to-br from-dental-primary/25 via-dental-secondary/20 to-dental-accent/25 shadow-glow`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-white/60 dark:border-white/10 opacity-70 animate-[pulse-soft_3s_ease-in-out_infinite]"
          />
          <span
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-dental-primary/25 via-transparent to-dental-accent/25 blur-lg opacity-60 animate-[spin_6s_linear_infinite]"
          />
          <Loader2 className={`${sizeClasses[size]} text-white drop-shadow-sm animate-spin`} />
        </span>

        {(size === "lg" || size === "xl") && (
          <>
            <Sparkles
              aria-hidden="true"
              className="absolute -top-3 -right-3 h-3 w-3 text-dental-accent animate-pulse"
            />
            <Heart
              aria-hidden="true"
              className="absolute -bottom-3 -left-3 h-3 w-3 text-dental-secondary animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className={`font-medium text-dental-foreground ${textSizeClasses[size]}`}>
          {message}
        </p>
        {description && (
          <p className="text-sm text-dental-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  switch (variant) {
    case "card":
      return (
        <Card className="glass-card">
          <CardContent className="flex items-center justify-center p-8">
            <LoadingContent />
          </CardContent>
        </Card>
      );

    case "overlay":
      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center p-8">
              <LoadingContent />
            </CardContent>
          </Card>
        </div>
      );

    case "minimal":
      return (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className={`${sizeClasses[size]} text-dental-primary animate-spin`} />
          <span className={`text-dental-muted-foreground ${textSizeClasses[size]}`}>
            {message}
          </span>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center p-8">
          <LoadingContent />
        </div>
      );
  }
}