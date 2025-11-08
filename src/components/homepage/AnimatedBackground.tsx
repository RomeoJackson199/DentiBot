import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  gradient: string;
}

const particles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 300 + 150,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 20 + 15,
  delay: Math.random() * 5,
  gradient: [
    "from-blue-400/20 to-cyan-400/20",
    "from-purple-400/20 to-pink-400/20",
    "from-indigo-400/20 to-blue-400/20",
    "from-pink-400/20 to-rose-400/20"
  ][Math.floor(Math.random() * 4)]
}));

export function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Mouse-reactive animated gradient orbs */}
      {particles.map((particle) => {
        const offsetX = useTransform(
          mouseX,
          [0, window.innerWidth],
          [-20, 20]
        );
        const offsetY = useTransform(
          mouseY,
          [0, window.innerHeight],
          [-20, 20]
        );

        return (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full bg-gradient-to-br ${particle.gradient} blur-3xl`}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              x: offsetX,
              y: offsetY,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -40, 40, 0],
              scale: [1, 1.1, 0.9, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Geometric shapes */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 border-2 border-blue-300/30 rounded-lg"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute bottom-40 left-20 w-24 h-24 border-2 border-purple-300/30"
        animate={{
          rotate: -360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full"
        animate={{
          y: [0, -50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #8b5cf6 1px, transparent 1px),
                           linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
