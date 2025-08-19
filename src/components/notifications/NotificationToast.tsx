import React from 'react';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

const toastIcons = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900', 
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const iconStyles = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600', 
  info: 'text-blue-600',
};

export function NotificationToast({
  type,
  title,
  message,
  action,
  onDismiss,
  className
}: NotificationToastProps) {
  const IconComponent = toastIcons[type];

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-fade-in max-w-sm",
      "backdrop-blur-sm bg-background/95 border-border/50",
      toastStyles[type],
      className
    )}>
      <div className={cn("mt-0.5", iconStyles[type])}>
        <IconComponent className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight">
            {title}
          </h4>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-5 w-5 p-0 hover:bg-black/10 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {message && (
          <p className="text-sm mt-1 opacity-90">
            {message}
          </p>
        )}
        
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="mt-2 text-xs h-7 hover-scale"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Toast container component for managing multiple toasts
export function NotificationToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  toasts: (NotificationToastProps & { id: string })[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <NotificationToast
            {...toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}