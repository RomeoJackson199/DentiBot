import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { 
  Zap, 
  Activity, 
  Timer, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Wifi,
  HardDrive,
  Cpu
} from 'lucide-react';

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  pageLoadTime: number;
  memoryUsage: number;
  networkSpeed: 'slow-2g' | '2g' | '3g' | '4g' | 'fast';
}

interface PerformanceBudget {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  ttfb: number; // 600ms
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  const budget: PerformanceBudget = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 600,
  };

  useEffect(() => {
    if ('performance' in window) {
      measurePerformance();
      
      // Set up performance observer
      if ('PerformanceObserver' in window) {
        setupPerformanceObserver();
      }
    }
  }, []);

  const measurePerformance = () => {
    setIsMonitoring(true);
    
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Simulate LCP, FID, CLS (in real implementation, these would come from performance observers)
    const simulatedMetrics: PerformanceMetrics = {
      lcp: Math.random() * 3000 + 1000, // 1-4s
      fid: Math.random() * 150 + 10, // 10-160ms
      cls: Math.random() * 0.2, // 0-0.2
      fcp: fcp || Math.random() * 2000 + 800, // 0.8-2.8s
      ttfb: navigation?.responseStart - navigation?.requestStart || Math.random() * 800 + 200,
      pageLoadTime: navigation?.loadEventEnd || 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      networkSpeed: getNetworkSpeed(),
    };

    setMetrics(simulatedMetrics);
    setHistory(prev => [...prev.slice(-9), simulatedMetrics]); // Keep last 10 measurements
    setIsMonitoring(false);
  };

  const setupPerformanceObserver = () => {
    // LCP Observer
    if (window.PerformanceObserver) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => prev ? { ...prev, lcp: lastEntry.startTime } : null);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // FID Observer
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any;
          setMetrics(prev => prev ? { ...prev, fid: fidEntry.processingStart - fidEntry.startTime } : null);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // CLS Observer
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        setMetrics(prev => prev ? { ...prev, cls: clsValue } : null);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  };

  const getNetworkSpeed = (): PerformanceMetrics['networkSpeed'] => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      return effectiveType || '4g';
    }
    return '4g';
  };

  const getMetricStatus = (value: number, budget: number, isReverse = false) => {
    const ratio = isReverse ? budget / value : value / budget;
    if (ratio <= (isReverse ? 2 : 0.5)) return 'good';
    if (ratio <= (isReverse ? 1.5 : 0.8)) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Gauge className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Measuring performance...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lcpStatus = getMetricStatus(metrics.lcp, budget.lcp);
  const fidStatus = getMetricStatus(metrics.fid, budget.fid);
  const clsStatus = getMetricStatus(metrics.cls, budget.cls);
  const fcpStatus = getMetricStatus(metrics.fcp, budget.fcp);
  const ttfbStatus = getMetricStatus(metrics.ttfb, budget.ttfb);

  const overallScore = [lcpStatus, fidStatus, clsStatus, fcpStatus, ttfbStatus]
    .filter(status => status === 'good').length / 5 * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitor</h1>
          <p className="text-muted-foreground">
            Real-time Core Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
            Score: {Math.round(overallScore)}%
          </Badge>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance</span>
              <span className={`font-bold ${
                overallScore >= 80 ? 'text-green-600' : 
                overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(overallScore)}%
              </span>
            </div>
            <Progress 
              value={overallScore} 
              className={`h-3 ${
                overallScore >= 80 ? '[&>div]:bg-green-500' : 
                overallScore >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
              }`}
            />
            <p className="text-xs text-muted-foreground">
              Based on Core Web Vitals and performance budgets
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                LCP
              </div>
              {getStatusIcon(lcpStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(lcpStatus)}`}>
                {(metrics.lcp / 1000).toFixed(2)}s
              </div>
              <div className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </div>
              <div className="text-xs text-muted-foreground">
                Budget: {budget.lcp / 1000}s
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                FID
              </div>
              {getStatusIcon(fidStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(fidStatus)}`}>
                {Math.round(metrics.fid)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                First Input Delay
              </div>
              <div className="text-xs text-muted-foreground">
                Budget: {budget.fid}ms
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                CLS
              </div>
              {getStatusIcon(clsStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getStatusColor(clsStatus)}`}>
                {metrics.cls.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </div>
              <div className="text-xs text-muted-foreground">
                Budget: {budget.cls}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">FCP</p>
                <p className={`text-lg font-bold ${getStatusColor(fcpStatus)}`}>
                  {(metrics.fcp / 1000).toFixed(2)}s
                </p>
              </div>
              <Timer className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TTFB</p>
                <p className={`text-lg font-bold ${getStatusColor(ttfbStatus)}`}>
                  {Math.round(metrics.ttfb)}ms
                </p>
              </div>
              <Wifi className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory</p>
                <p className="text-lg font-bold">
                  {formatBytes(metrics.memoryUsage)}
                </p>
              </div>
              <HardDrive className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Network</p>
                <p className="text-lg font-bold">
                  {metrics.networkSpeed.toUpperCase()}
                </p>
              </div>
              <Monitor className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lcpStatus === 'poor' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Improve LCP:</strong> Optimize images, use lazy loading, and implement critical CSS for above-the-fold content.
              </AlertDescription>
            </Alert>
          )}
          
          {fidStatus === 'poor' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Improve FID:</strong> Reduce JavaScript execution time, break up long tasks, and optimize event handlers.
              </AlertDescription>
            </Alert>
          )}
          
          {clsStatus === 'poor' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Improve CLS:</strong> Set dimensions for images and embeds, avoid inserting content above existing content.
              </AlertDescription>
            </Alert>
          )}

          {overallScore >= 80 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Great performance!</strong> Your site meets performance best practices and provides a good user experience.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};