import React from 'react';

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure and log performance metrics
  measurePerformance: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  },

  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  // Throttle function for frequent events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy load images when they enter viewport
  lazyLoadImages: () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Memory usage monitoring
  logMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log({
        usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  },

  // Web Vitals tracking
  trackWebVitals: () => {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming;
        console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

// React-specific performance utilities
export const reactPerformance = {
  // Log render counts for debugging
  useRenderCount: (componentName: string) => {
    const renderCount = React.useRef(0);
    React.useEffect(() => {
      renderCount.current += 1;
      console.log(`${componentName} rendered ${renderCount.current} times`);
    });
  },

  // Check for expensive renders
  useWhyDidYouUpdate: (name: string, props: Record<string, any>) => {
    const previous = React.useRef<Record<string, any>>();
    React.useEffect(() => {
      if (previous.current) {
        const allKeys = Object.keys({ ...previous.current, ...props });
        const changedProps: Record<string, any> = {};
        allKeys.forEach(key => {
          if (previous.current![key] !== props[key]) {
            changedProps[key] = {
              from: previous.current![key],
              to: props[key]
            };
          }
        });
        if (Object.keys(changedProps).length) {
          console.log('[why-did-you-update]', name, changedProps);
        }
      }
      previous.current = props;
    });
  }
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic imports for code splitting
  loadModule: async <T>(importFn: () => Promise<T>): Promise<T> => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Failed to load module:', error);
      throw error;
    }
  },

  // Check bundle size impact
  analyzeBundle: () => {
    console.log('Navigation timing:', performance.getEntriesByType('navigation')[0]);
    console.log('Resource timing:', performance.getEntriesByType('resource'));
  }
};