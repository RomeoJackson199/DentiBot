import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "strong" | "elevated" | "interactive";
    gradient?: boolean;
    noPadding?: boolean;
}

export function GlassCard({
    children,
    className,
    variant = "default",
    gradient = false,
    noPadding = false,
    ...props
}: GlassCardProps) {

    const variants = {
        default: "bg-white/40 dark:bg-black/20 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-glass",
        strong: "bg-white/60 dark:bg-black/40 backdrop-blur-2xl border-white/30 dark:border-white/20 shadow-elegant",
        elevated: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-xl",
        interactive: "bg-white/40 dark:bg-black/20 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-glass hover:shadow-lg hover:scale-[1.01] hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative rounded-2xl border overflow-hidden",
                variants[variant],
                gradient && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none dark:before:from-white/5",
                !noPadding && "p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function GlassCardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
            {children}
        </div>
    );
}

export function GlassCardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("font-semibold leading-none tracking-tight text-xl", className)} {...props}>
            {children}
        </h3>
    );
}

export function GlassCardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)} {...props}>
            {children}
        </p>
    );
}

export function GlassCardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("", className)} {...props}>
            {children}
        </div>
    );
}
