import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Mobile-specific styles and optimizations
export function MobileOptimizations() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Add mobile-specific styles
      document.documentElement.style.setProperty('--mobile-padding', '1rem');
      document.documentElement.style.setProperty('--mobile-text-size', '16px');
      
      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
      
      // Add touch-friendly styles
      const style = document.createElement('style');
      style.textContent = `
        /* Mobile-optimized touch targets */
        button, a, [role="button"] {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }
        
        /* Smooth scrolling */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Remove tap highlight */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Mobile-friendly inputs */
        input, textarea, select {
          font-size: 16px !important;
          border-radius: 12px;
          padding: 16px;
          min-height: 48px;
        }
        
        /* Safe area support */
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* Mobile card spacing */
        .mobile-card {
          margin: 0.75rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.1);
        }
        
        /* Mobile navigation */
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: hsl(var(--background) / 0.98);
          backdrop-filter: blur(16px);
          border-top: 1px solid hsl(var(--border) / 0.5);
          padding: 0.75rem;
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
          z-index: 50;
        }
        
        /* Mobile-optimized text */
        .mobile-text {
          font-size: 15px;
          line-height: 1.6;
        }
        
        /* Mobile-friendly modals */
        .mobile-modal {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
          border-radius: 20px;
        }
        
        /* Swipe gestures */
        .swipeable {
          touch-action: pan-y;
          user-select: none;
        }
        
        /* Prevent double-tap zoom */
        input, select, textarea, button {
          touch-action: manipulation;
        }
        
        /* Better mobile scrolling */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Reduce motion for better performance */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isMobile]);

  return null;
}

// Hook for mobile-specific behavior
export function useMobileOptimizations() {
  const isMobile = useIsMobile();
  
  return {
    isMobile,
    cardClass: isMobile ? 'mobile-card' : '',
    textClass: isMobile ? 'mobile-text' : '',
    modalClass: isMobile ? 'mobile-modal' : '',
    buttonSize: isMobile ? 'lg' : 'default',
    spacing: isMobile ? 'space-y-4' : 'space-y-6',
    padding: isMobile ? 'p-4' : 'p-6',
    margin: isMobile ? 'm-2' : 'm-4'
  };
}