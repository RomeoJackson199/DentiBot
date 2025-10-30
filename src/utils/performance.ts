// Performance monitoring and optimization utilities

export const performanceTracker = {
  // Track component render time
  trackRender: (componentName: string, renderFn: () => any) => {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();

    return result;
  },

  // Track function execution time
  trackFunction: async <T>(functionName: string, asyncFn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const end = performance.now();

      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ ${functionName} failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Monitor memory usage
  monitorMemory: () => {
    // Memory monitoring removed for production
  }
};

// Debounce function with TypeScript support
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function with TypeScript support  
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy load images with intersection observer
export const createImageLoader = () => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    disconnect: () => imageObserver.disconnect()
  };
};

// Virtual scrolling helper
export const calculateVisibleItems = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return { startIndex, endIndex };
};

// Bundle analyzer helper for development
export const analyzeBundleSize = () => {
  // This would typically integrate with webpack-bundle-analyzer
};