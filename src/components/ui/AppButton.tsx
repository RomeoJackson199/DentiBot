import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppButtonProps extends ButtonProps {
	fullWidth?: boolean;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
	({ className, variant = "gradient", size = "desktop", fullWidth = false, children, ...props }, ref) => {
		return (
			<Button
				ref={ref}
				variant={variant}
				size={size}
				className={cn(
					"btn-soft",
					fullWidth && "w-full",
					className
				)}
				{...props}
			>
				{children}
			</Button>
		);
	}
);

AppButton.displayName = "AppButton";