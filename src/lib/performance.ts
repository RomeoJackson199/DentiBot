/**
 * Performance Monitoring and Optimization Utilities
 *
 * Provides tools for measuring and improving application performance
 */

import { logger } from './logger';

// Performance metric types
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface VitalMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive
}

/**
 * Get Web Vitals thresholds
 */
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  TTI: { good: 3800, poor: 7300 },
};

/**
 * Rate a metric based on thresholds
 */
function rateMetric(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(callback?: (metric: PerformanceMetric) => void) {
  if (typeof window === 'undefined' || !window.performance) return;

  // Only run in production or when explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING) {
    logger.log('Performance monitoring disabled in development');
    return;
  }

  try {
    // First Contentful Paint (FCP)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      const metric: PerformanceMetric = {
        name: 'FCP',
        value: fcpEntry.startTime,
        rating: rateMetric('FCP', fcpEntry.startTime),
        timestamp: Date.now(),
      };
      logger.log('FCP:', metric.value.toFixed(2), 'ms', `(${metric.rating})`);
      callback?.(metric);
    }

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const metric: PerformanceMetric = {
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        rating: rateMetric('LCP', lastEntry.renderTime || lastEntry.loadTime),
        timestamp: Date.now(),
      };
      logger.log('LCP:', metric.value.toFixed(2), 'ms', `(${metric.rating})`);
      callback?.(metric);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const metric: PerformanceMetric = {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: rateMetric('FID', entry.processingStart - entry.startTime),
          timestamp: Date.now(),
        };
        logger.log('FID:', metric.value.toFixed(2), 'ms', `(${metric.rating})`);
        callback?.(metric);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      const metric: PerformanceMetric = {
        name: 'CLS',
        value: clsValue,
        rating: rateMetric('CLS', clsValue),
        timestamp: Date.now(),
      };
      logger.log('CLS:', metric.value.toFixed(3), `(${metric.rating})`);
      callback?.(metric);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

  } catch (error) {
    logger.error('Error reporting web vitals:', error);
  }
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string, callback: () => void) {
  const start = performance.now();
  callback();
  const end = performance.now();
  const duration = end - start;

  logger.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);

  if (duration > 16) {
    logger.warn(`[Slow Render] ${componentName} took ${duration.toFixed(2)}ms (target: <16ms for 60fps)`);
  }

  return duration;
}

/**
 * Measure async operation time
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const end = performance.now();
    const duration = end - start;
    logger.log(`[Async] ${operationName}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    logger.error(`[Async Failed] ${operationName}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Create a performance marker
 */
export function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
    logger.log(`[Mark] ${name}`);
  }
}

/**
 * Measure between two performance markers
 */
export function measure(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      const duration = measures[measures.length - 1].duration;
      logger.log(`[Measure] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    } catch (error) {
      logger.error(`Failed to measure ${name}:`, error);
    }
  }
}

/**
 * Log bundle size information (development only)
 */
export function logBundleInfo() {
  if (import.meta.env.PROD) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scripts = resources.filter((r) => r.initiatorType === 'script');
  const styles = resources.filter((r) => r.initiatorType === 'link' && r.name.includes('.css'));

  const totalScriptSize = scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0);
  const totalStyleSize = styles.reduce((sum, s) => sum + (s.transferSize || 0), 0);

  logger.log('=== Bundle Size Info ===');
  logger.log(`Scripts: ${(totalScriptSize / 1024).toFixed(2)} KB (${scripts.length} files)`);
  logger.log(`Styles: ${(totalStyleSize / 1024).toFixed(2)} KB (${styles.length} files)`);
  logger.log(`Total: ${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB`);

  // Log largest files
  const largest = resources
    .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
    .slice(0, 10);

  logger.log('\nLargest Resources:');
  largest.forEach((resource, i) => {
    const size = (resource.transferSize || 0) / 1024;
    const name = resource.name.split('/').pop() || resource.name;
    logger.log(`${i + 1}. ${name}: ${size.toFixed(2)} KB`);
  });
}

/**
 * Monitor long tasks (tasks > 50ms)
 */
export function monitorLongTasks(callback?: (duration: number) => void) {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logger.warn(`[Long Task] ${entry.duration.toFixed(2)}ms`);
        callback?.(entry.duration);
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // longtask API not supported in all browsers
    logger.log('Long task monitoring not supported');
  }
}

/**
 * Get current performance metrics
 */
export function getCurrentMetrics(): VitalMetrics {
  if (typeof performance === 'undefined') return {};

  const metrics: VitalMetrics = {};

  // FCP
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
  if (fcpEntry) {
    metrics.FCP = fcpEntry.startTime;
  }

  // TTFB
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navEntry) {
    metrics.TTFB = navEntry.responseStart - navEntry.requestStart;
  }

  return metrics;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Report web vitals
  reportWebVitals((metric) => {
    // In production, you would send this to your analytics service
    // For now, we just log it
    if (metric.rating === 'poor') {
      logger.warn(`Poor ${metric.name} performance:`, metric.value);
    }
  });

  // Monitor long tasks
  monitorLongTasks((duration) => {
    if (duration > 100) {
      logger.warn(`Very long task detected: ${duration.toFixed(2)}ms`);
    }
  });

  // Log bundle info in development
  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      setTimeout(logBundleInfo, 1000);
    });
  }

  logger.log('Performance monitoring initialized');
}

// Export a simpler API for common use cases
export const perf = {
  mark,
  measure,
  measureAsync,
  init: initPerformanceMonitoring,
  getCurrentMetrics,
};

export default perf;
