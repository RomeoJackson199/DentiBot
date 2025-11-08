import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTemplate } from '@/contexts/TemplateContext';
import { TemplateType } from '@/lib/businessTemplates';
import {
  Scissors,
  UtensilsCrossed,
  Stethoscope,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Star,
  Clock,
  ShoppingBag,
} from 'lucide-react';

/**
 * Template-specific dashboard widgets that show personalized metrics
 * and insights based on the business type
 */

interface DashboardMetric {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  description?: string;
  color?: string;
}

export function TemplateDashboardHeader() {
  const { template, t } = useTemplate();

  const getWelcomeMessage = () => {
    return {
      title: '🦷 Dental Dashboard',
      subtitle: `Comprehensive dental practice overview`,
    };
  };

  const { title, subtitle } = getWelcomeMessage();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

export function TemplateSpecificMetrics() {
  const { template, templateType, t } = useTemplate();

  // Healthcare metrics
  const getTemplateMetrics = (): DashboardMetric[] => {
    return [
      {
        icon: Users,
        label: `${t('customerPlural')} Today`,
        value: '-',
        description: 'Scheduled',
        color: 'text-blue-600',
      },
      {
        icon: Calendar,
        label: 'Procedures This Week',
        value: '-',
        description: 'Treatments',
        color: 'text-green-600',
      },
      {
        icon: Star,
        label: 'Treatment Plans Active',
        value: '-',
        description: 'In progress',
        color: 'text-yellow-600',
      },
      {
        icon: TrendingUp,
        label: 'Recall Due',
        value: '-',
        description: '6-month checkups',
        color: 'text-purple-600',
      },
    ];
  };

  const metrics = getTemplateMetrics();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.description && (
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            )}
            {metric.trend && (
              <p className="text-xs text-green-600 mt-1">{metric.trend}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TemplateQuickActions() {
  const { template, templateType, t } = useTemplate();

  const getQuickActions = () => {
    return [
      { label: `New ${t('customer')}`, description: 'Add patient' },
      { label: 'Write Prescription', description: 'Quick Rx' },
      { label: 'Emergency Slot', description: 'Urgent care' },
      { label: 'Lab Results', description: 'View reports' },
    ];
  };

  const actions = getQuickActions();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for your {template?.name.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className="p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left"
            >
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateInsights() {
  const { templateType, t } = useTemplate();

  const getInsights = () => {
    return [
      '📋 12 patients due for 6-month checkups',
      '📊 Your practice is running 15% ahead of schedule today',
      '💊 3 prescription refills pending approval',
      '🎯 Follow-up compliance rate is 88%',
    ];
  };

  const insights = getInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights & Recommendations</CardTitle>
        <CardDescription>Personalized tips for your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{insight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
