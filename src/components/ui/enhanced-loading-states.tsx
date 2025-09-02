// Enhanced loading states with better UX
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          className={`h-4 rounded ${
            index === 0 ? 'w-3/4' : 
            index === lines - 1 ? 'w-1/2' : 
            'w-2/3'
          }`} 
        />
      ))}
    </div>
  );
}

interface AppointmentCardSkeletonProps {
  className?: string;
}

export function AppointmentCardSkeleton({ className = "" }: AppointmentCardSkeletonProps) {
  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <Skeleton className="h-8 w-full" />
        
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className = "", label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

interface RetryableErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function RetryableError({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = ""
}: RetryableErrorProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressIndicator({
  current,
  total,
  label,
  className = ""
}: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span>{current} of {total}</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-dental-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        {percentage}% complete
      </div>
    </div>
  );
}

interface PulsingDotProps {
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function PulsingDot({ className = "", color = 'primary' }: PulsingDotProps) {
  const colorClasses = {
    primary: 'bg-dental-primary',
    success: 'bg-dental-success',
    warning: 'bg-dental-warning',
    danger: 'bg-dental-error'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
      <div className={`absolute inset-0 w-3 h-3 rounded-full ${colorClasses[color]} animate-ping opacity-30`} />
    </div>
  );
}