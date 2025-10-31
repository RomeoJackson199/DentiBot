import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
  variant?: "checkmark" | "confetti" | "pulse";
}

export function SuccessAnimation({
  show,
  message = "Success!",
  onComplete,
  duration = 2000,
  variant = "checkmark",
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (variant === "checkmark") {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-green-400 rounded-full blur-3xl opacity-30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Success icon */}
              <motion.div
                className="relative bg-white rounded-full p-6 shadow-2xl"
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-20 w-20 text-green-500" />

                {/* Checkmark path animation */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <svg
                    className="h-16 w-16 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </svg>
                </motion.div>
              </motion.div>

              {/* Message */}
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mt-4 text-lg font-semibold text-gray-900"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === "confetti") {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none overflow-hidden"
          >
            {/* Confetti particles */}
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: [
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                  ][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: "50%",
                }}
                animate={{
                  y: [0, -300, 800],
                  x: [(Math.random() - 0.5) * 400],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Success message */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative bg-white rounded-2xl p-8 shadow-2xl"
            >
              <Sparkles className="h-16 w-16 text-yellow-500 mx-auto" />
              {message && (
                <p className="text-xl font-bold text-gray-900 mt-4">{message}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Pulse variant
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: 2,
              ease: "easeInOut",
            }}
            className="bg-white rounded-full p-8 shadow-2xl"
          >
            <div className="relative">
              {/* Pulse rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4 border-green-500"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                />
              ))}

              <Check className="h-16 w-16 text-green-500 relative z-10" />
            </div>
          </motion.div>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute text-xl font-semibold text-gray-900 mt-32"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
