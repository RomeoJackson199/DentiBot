/**
 * Polished, Production-Ready UI Components
 * Modern, animated, accessible components for professional UX
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Activity,
  Heart,
  DollarSign,
  Users,
  Package,
  Inbox,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Enhanced Card with Gradient Border
 */
interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  hover?: boolean;
}

export function GradientCard({ children, className, gradient = "from-blue-500 to-purple-500", hover = true }: GradientCardProps) {
  return (
    <div className="relative group">
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r rounded-2xl opacity-75 blur",
        gradient,
        hover && "group-hover:opacity-100 transition duration-500"
      )} />
      <Card className={cn("relative bg-white dark:bg-gray-900", className)}>
        {children}
      </Card>
    </div>
  );
}

/**
 * Stat Card with Icon and Trend
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  description?: string;
  gradient?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, description, gradient = "from-blue-500 to-cyan-500", loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer border-2 hover:border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight group-hover:text-blue-600 transition-colors">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend !== undefined && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend >= 0 ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
                <span>{Math.abs(trend)}%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            gradient,
            "group-hover:scale-110 transition-transform duration-300"
          )}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-16">
        <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto">
          <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <Icon className="h-12 w-12 text-gray-400" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {action && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={action.onClick}
                className="gap-2 shadow-md hover:shadow-lg transition-shadow"
                size="lg"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>

              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  size="lg"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Feature Card with Icon
 */
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient?: string;
  onClick?: () => void;
}

export function FeatureCard({ icon: Icon, title, description, gradient = "from-blue-500 to-cyan-500", onClick }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
        gradient
      )} />

      <CardContent className="relative pt-6">
        <div className={cn(
          "inline-flex p-3 rounded-xl bg-gradient-to-br mb-4 group-hover:scale-110 transition-transform duration-300",
          gradient
        )}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Action Button
 */
interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  color?: string;
  bgColor?: string;
}

export function QuickAction({ icon: Icon, label, description, onClick, color = "text-blue-600", bgColor = "bg-blue-50 hover:bg-blue-100" }: QuickActionProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all border-0",
        bgColor
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={label}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Icon className={cn("h-6 w-6", color)} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Status Badge
 */
interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "pending";
  label: string;
  icon?: boolean;
}

export function StatusBadge({ status, label, icon = true }: StatusBadgeProps) {
  const configs = {
    success: {
      className: "bg-green-100 text-green-800 border-green-300",
      Icon: CheckCircle2,
    },
    warning: {
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Icon: AlertCircle,
    },
    error: {
      className: "bg-red-100 text-red-800 border-red-300",
      Icon: XCircle,
    },
    info: {
      className: "bg-blue-100 text-blue-800 border-blue-300",
      Icon: Info,
    },
    pending: {
      className: "bg-gray-100 text-gray-800 border-gray-300",
      Icon: Clock,
    },
  };

  const config = configs[status];

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", config.className)}>
      {icon && <config.Icon className="h-3 w-3" aria-hidden="true" />}
      {label}
    </Badge>
  );
}

/**
 * Info Card
 */
interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

export function InfoCard({ icon: Icon, label, value, subValue }: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Card Skeleton
 */
export function LoadingCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Animated Gradient Background
 */
export function AnimatedBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
    </div>
  );
}

/**
 * Section Header
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  gradient?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
}

export function SectionHeader({ title, description, icon: Icon, gradient, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient || 'from-primary to-primary/80'}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Timeline Item
 */
interface TimelineItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  iconColor?: string;
  isLast?: boolean;
}

export function TimelineItem({ icon: Icon, title, description, time, iconColor = "bg-blue-500", isLast }: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div className={cn(
        "relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        iconColor
      )}>
        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
      </div>

      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Progress Card
 */
interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  icon: React.ElementType;
  color?: string;
}

export function ProgressCard({ title, current, total, icon: Icon, color = "bg-blue-500" }: ProgressCardProps) {
  const percentage = (current / total) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", color)}>
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-semibold">{title}</h3>
          </div>
          <span className="text-sm text-muted-foreground">{current} / {total}</span>
        </div>

        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-2">{percentage.toFixed(0)}% complete</p>
      </CardContent>
    </Card>
  );
}

/**
 * Alert Banner
 */
interface AlertBannerProps {
  type: "info" | "warning" | "success" | "error";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export function AlertBanner({ type, title, description, action, onDismiss }: AlertBannerProps) {
  const configs = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
  };

  const config = configs[type];

  return (
    <div className={cn("rounded-lg border p-4", config.bg)}>
      <div className="flex gap-3">
        <config.icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} aria-hidden="true" />

        <div className="flex-1">
          <h4 className={cn("font-semibold", config.textColor)}>{title}</h4>
          {description && (
            <p className={cn("text-sm mt-1", config.textColor, "opacity-90")}>{description}</p>
          )}
          {action && (
            <Button
              variant="link"
              onClick={action.onClick}
              className={cn("p-0 h-auto mt-2", config.iconColor)}
            >
              {action.label}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn("flex-shrink-0 p-1 rounded hover:bg-black/5", config.textColor)}
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
