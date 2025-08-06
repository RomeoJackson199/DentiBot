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
          font-size: 16px;
          border-radius: 8px;
          padding: 12px;
        }
        
        /* Mobile card spacing */
        .mobile-card {
          margin: 0.5rem;
          border-radius: 12px;
        }
        
        /* Mobile navigation */
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid hsl(var(--border));
          padding: 0.5rem;
          z-index: 50;
        }
        
        /* Mobile-optimized text */
        .mobile-text {
          font-size: 14px;
          line-height: 1.5;
        }
        
        /* Mobile-friendly modals */
        .mobile-modal {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
          border-radius: 16px;
        }
        
        /* Swipe gestures */
        .swipeable {
          touch-action: pan-y;
          user-select: none;
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