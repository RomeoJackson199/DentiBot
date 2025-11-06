import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface ConfettiProps {
  /**
   * Number of confetti pieces to generate
   */
  count?: number

  /**
   * Duration of animation in milliseconds
   */
  duration?: number

  /**
   * Colors for confetti pieces
   */
  colors?: string[]

  /**
   * Whether to show confetti
   */
  active?: boolean

  /**
   * Callback when animation completes
   */
  onComplete?: () => void
}

interface ConfettiPiece {
  id: number
  left: number
  animationDelay: number
  animationDuration: number
  color: string
  rotation: number
}

/**
 * Confetti animation component
 * Perfect for celebrating successful bookings, payments, etc.
 *
 * @example
 * // Show confetti on successful appointment booking
 * const [showConfetti, setShowConfetti] = useState(false)
 *
 * const handleBooking = async () => {
 *   await bookAppointment()
 *   setShowConfetti(true)
 * }
 *
 * <Confetti
 *   active={showConfetti}
 *   onComplete={() => setShowConfetti(false)}
 * />
 */
export const Confetti: React.FC<ConfettiProps> = ({
  count = 50,
  duration = 3000,
  colors = [
    "hsl(var(--dental-primary))",
    "hsl(var(--dental-secondary))",
    "hsl(var(--dental-accent))",
    "hsl(var(--success-600))",
    "#FFD700",
    "#FF69B4",
  ],
  active = false,
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (active) {
      const confettiPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 0.5,
        animationDuration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      }))

      setPieces(confettiPieces)

      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [active, count, duration, colors, onComplete])

  if (!active || pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 rounded-sm animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.animationDelay}s`,
            animationDuration: `${piece.animationDuration}s`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// Add to tailwind.config.ts:
/*
'confetti': {
  '0%': {
    transform: 'translateY(-100vh) rotate(0deg)',
    opacity: '1',
  },
  '100%': {
    transform: 'translateY(100vh) rotate(720deg)',
    opacity: '0',
  },
}

animation: {
  'confetti': 'confetti 3s ease-in forwards',
}
*/
