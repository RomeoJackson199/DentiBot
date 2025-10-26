import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export interface AppButtonProps extends ButtonProps {
  fullWidth?: boolean;
}
export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(({
  className,
  variant = "gradient",
  size = "desktop",
  fullWidth = false,
  children,
  ...props
}, ref) => {
  return;
});
AppButton.displayName = "AppButton";