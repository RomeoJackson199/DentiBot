import { useRef, useState } from 'react';

interface TiltConfig {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

export function useTiltEffect(config: TiltConfig = {}) {
  const {
    maxTilt = 10,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
  } = config;

  const ref = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    });
  };

  return {
    ref,
    tiltStyle,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
