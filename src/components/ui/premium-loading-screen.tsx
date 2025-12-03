import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PremiumLoadingScreenProps {
    message?: string;
    description?: string;
}

export function PremiumLoadingScreen({
    message = "Loading...",
    description = "Preparing your experience"
}: PremiumLoadingScreenProps) {
    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="h-16 w-16 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-xl flex items-center justify-center shadow-2xl">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg border border-blue-100"
                        >
                            <Sparkles className="h-3 w-3 text-blue-600" />
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2 text-center">
                        {message}
                    </h2>
                    <p className="text-muted-foreground text-center max-w-xs mx-auto">
                        {description}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
