import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <div className="max-w-md mx-auto space-y-6">
        {/* Icon */}
        {Icon && (
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative p-4 rounded-full bg-blue-100">
                <Icon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed">{description}</p>

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {actionLabel && onAction && (
              <Button
                onClick={onAction}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                onClick={onSecondaryAction}
                size="lg"
                variant="outline"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
