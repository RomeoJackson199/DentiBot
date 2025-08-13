import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin text-dental-primary" />
      <span className="text-dental-muted-foreground">Loading...</span>
    </div>
  </div>
);

export const LazyLoadingWrapper: React.FC<LazyLoadingWrapperProps> = ({ 
  children, 
  fallback = <DefaultFallback /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};