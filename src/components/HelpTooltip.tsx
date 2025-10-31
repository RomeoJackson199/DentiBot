import { HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string | React.ReactNode;
  variant?: "default" | "info";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

export function HelpTooltip({
  content,
  variant = "default",
  side = "top",
  align = "center",
  className = "",
  iconSize = "sm",
}: HelpTooltipProps) {
  const Icon = variant === "info" ? Info : HelpCircle;

  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            <Icon className={sizes[iconSize]} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {typeof content === "string" ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline version for use within form labels
interface InlineHelpTooltipProps {
  label: string;
  help: string;
  required?: boolean;
}

export function InlineHelpTooltip({ label, help, required }: InlineHelpTooltipProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <HelpTooltip content={help} iconSize="sm" />
    </div>
  );
}
