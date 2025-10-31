/**
 * DentiBot Logo Component
 * Professional SVG logo with multiple size variants
 */

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: 16 },
  md: { icon: 32, text: 20 },
  lg: { icon: 48, text: 28 },
  xl: { icon: 64, text: 36 },
};

export function Logo({ size = "md", variant = "full", className = "" }: LogoProps) {
  const { icon: iconSize, text: textSize } = sizeMap[size];

  const iconOnly = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tooth shape with modern gradient */}
      <defs>
        <linearGradient id="toothGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Main tooth body */}
      <path
        d="M50 15 C40 15, 30 20, 25 30 C20 40, 20 50, 22 60 C24 70, 28 80, 35 85 C40 88, 45 90, 50 90 C55 90, 60 88, 65 85 C72 80, 76 70, 78 60 C80 50, 80 40, 75 30 C70 20, 60 15, 50 15 Z"
        fill="url(#toothGradient)"
        stroke="white"
        strokeWidth="2"
      />

      {/* Crown details */}
      <path
        d="M35 30 Q50 25 65 30"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />

      {/* Sparkle effect top right */}
      <g transform="translate(65, 25)">
        <path
          d="M0 -6 L1 -1 L6 0 L1 1 L0 6 L-1 1 L-6 0 L-1 -1 Z"
          fill="url(#sparkleGradient)"
          opacity="0.9"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Subtle highlight */}
      <ellipse
        cx="42"
        cy="35"
        rx="8"
        ry="12"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );

  const textOnly = (
    <span
      className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${className}`}
      style={{ fontSize: textSize }}
    >
      DentiBot
    </span>
  );

  if (variant === "icon") return iconOnly;
  if (variant === "text") return textOnly;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconOnly}
      {textOnly}
    </div>
  );
}

/**
 * Animated Logo for splash screens and loading states
 */
export function AnimatedLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const { icon: iconSize } = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <svg
        width={iconSize * 1.5}
        height={iconSize * 1.5}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb">
              <animate
                attributeName="stop-color"
                values="#2563eb; #7c3aed; #2563eb"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#7c3aed">
              <animate
                attributeName="stop-color"
                values="#7c3aed; #2563eb; #7c3aed"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {/* Animated tooth */}
        <path
          d="M50 15 C40 15, 30 20, 25 30 C20 40, 20 50, 22 60 C24 70, 28 80, 35 85 C40 88, 45 90, 50 90 C55 90, 60 88, 65 85 C72 80, 76 70, 78 60 C80 50, 80 40, 75 30 C70 20, 60 15, 50 15 Z"
          fill="url(#animatedGradient)"
          stroke="white"
          strokeWidth="2"
        >
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1.05; 1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Multiple sparkles */}
        <g>
          {[65, 35, 50].map((x, i) => (
            <g key={i} transform={`translate(${x}, ${25 + i * 20})`}>
              <path
                d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"
                fill="white"
                opacity="0.8"
              >
                <animate
                  attributeName="opacity"
                  values="0.3; 1; 0.3"
                  dur={`${1.5 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          ))}
        </g>
      </svg>

      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        DentiBot
      </div>
    </div>
  );
}

/**
 * Favicon-ready icon (simplified for small sizes)
 */
export function FaviconIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="6" fill="#2563eb" />
      <path
        d="M16 8 C13 8, 10 9, 9 12 C8 14, 8 16, 9 18 C10 20, 11 22, 13 23 C14 24, 15 24, 16 24 C17 24, 18 24, 19 23 C21 22, 22 20, 23 18 C24 16, 24 14, 23 12 C22 9, 19 8, 16 8 Z"
        fill="white"
      />
      <circle cx="14" cy="13" r="1.5" fill="#2563eb" opacity="0.3" />
    </svg>
  );
}
