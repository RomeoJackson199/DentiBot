import { useState, useRef, useEffect, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

/**
 * Pull-to-Refresh Component
 *
 * Provides a native mobile-like pull-to-refresh experience.
 * Only activates on touch devices when scrolled to the top.
 *
 * @example
 * ```tsx
 * <PullToRefresh onRefresh={async () => {
 *   await refetch();
 * }}>
 *   <YourContent />
 * </PullToRefresh>
 * ```
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  maxPullDistance = 150,
  refreshingText = "Refreshing...",
  pullText = "Pull down to refresh",
  releaseText = "Release to refresh",
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canPull = useRef(false);

  // Check if we're at the top of the scroll container
  const isAtTop = () => {
    if (!containerRef.current) return false;

    // Check both window scroll and container scroll
    const windowAtTop = window.scrollY === 0;
    const containerAtTop = containerRef.current.scrollTop === 0;

    return windowAtTop && containerAtTop;
  };

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) {
      canPull.current = false;
      return;
    }

    canPull.current = true;
    startY.current = e.touches[0].clientY;
  };

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!canPull.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only allow pulling down
    if (distance > 0) {
      setIsPulling(true);

      // Apply resistance to pull distance (gets harder to pull the more you pull)
      const resistance = 0.5;
      const adjustedDistance = Math.min(
        distance * resistance,
        maxPullDistance
      );

      setPullDistance(adjustedDistance);

      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!canPull.current || disabled || isRefreshing) return;

    setIsPulling(false);
    canPull.current = false;

    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh error:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Bounce back if not pulled enough
      setPullDistance(0);
    }
  };

  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, threshold]);

  // Calculate indicator state
  const progress = Math.min(pullDistance / threshold, 1);
  const isReadyToRefresh = pullDistance >= threshold;
  const showIndicator = isPulling || isRefreshing;

  // Determine message
  let message = pullText;
  if (isRefreshing) {
    message = refreshingText;
  } else if (isReadyToRefresh) {
    message = releaseText;
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      style={{
        transform: showIndicator ? `translateY(${Math.min(pullDistance, 80)}px)` : undefined,
        transition: isPulling ? "none" : "transform 300ms ease-out",
      }}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center"
        style={{
          height: showIndicator ? "80px" : "0px",
          marginTop: "-80px",
          opacity: showIndicator ? 1 : 0,
          transition: isPulling ? "none" : "opacity 300ms ease-out",
        }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <div
            className={`${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isPulling && !isRefreshing
                ? `rotate(${progress * 360}deg)`
                : undefined,
              transition: isPulling ? "none" : undefined,
            }}
          >
            <RefreshCw
              className={`w-6 h-6 ${
                isReadyToRefresh && !isRefreshing
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            />
          </div>
          <span className="text-sm font-medium">{message}</span>
        </div>

        {/* Progress bar */}
        {!isRefreshing && (
          <div className="w-16 h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                isReadyToRefresh ? "bg-blue-600" : "bg-gray-400"
              } transition-all duration-150`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

/**
 * Hook for programmatic refresh control
 *
 * @example
 * ```tsx
 * const { isRefreshing, refresh } = usePullToRefresh();
 *
 * <PullToRefresh onRefresh={refresh} disabled={isRefreshing}>
 *   <YourContent />
 * </PullToRefresh>
 *
 * <Button onClick={refresh}>Manual Refresh</Button>
 * ```
 */
export function usePullToRefresh(refreshFn: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshFn();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refresh,
  };
}

/**
 * Simple refresh trigger (without pull-to-refresh UI)
 * For desktop or when you just need the loading state
 *
 * @example
 * ```tsx
 * <RefreshButton onRefresh={async () => await refetch()} />
 * ```
 */
interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RefreshButton({
  onRefresh,
  className = "",
  label,
  size = "md",
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRefreshing}
      className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900
                 hover:bg-gray-100 rounded-lg transition-colors duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      aria-label="Refresh"
    >
      <RefreshCw
        className={`${iconSizes[size]} ${isRefreshing ? "animate-spin" : ""}`}
      />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
