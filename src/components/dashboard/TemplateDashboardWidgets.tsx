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
    switch (template?.id) {
      case 'hairdresser':
        return {
          title: '✨ Style Dashboard',
          subtitle: `Manage your ${t('business').toLowerCase()} and track your styling success`,
        };
      case 'restaurant':
        return {
          title: '🍽️ Restaurant Dashboard',
          subtitle: `Manage reservations and track your dining service`,
        };
      case 'dentist':
        return {
          title: '🦷 Dental Dashboard',
          subtitle: `Comprehensive dental practice overview`,
        };
      default:
        return {
          title: '📊 Business Dashboard',
          subtitle: `Manage your ${t('business').toLowerCase()} efficiently`,
        };
    }
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

  // Template-specific metrics suggestions
  const getTemplateMetrics = (): DashboardMetric[] => {
    switch (templateType) {
      case 'hairdresser':
        return [
          {
            icon: Scissors,
            label: 'Styles Completed',
            value: '-',
            description: 'This week',
            color: 'text-pink-600',
          },
          {
            icon: Star,
            label: 'Client Satisfaction',
            value: '-',
            description: 'Average rating',
            color: 'text-yellow-600',
          },
          {
            icon: TrendingUp,
            label: 'Popular Service',
            value: 'Haircut & Style',
            description: 'Most booked',
            color: 'text-purple-600',
          },
          {
            icon: Clock,
            label: 'Walk-in Availability',
            value: 'Available',
            description: 'Today',
            color: 'text-green-600',
          },
        ];

      case 'restaurant':
        return [
          {
            icon: UtensilsCrossed,
            label: 'Reservations Today',
            value: '-',
            description: 'Tables booked',
            color: 'text-orange-600',
          },
          {
            icon: Users,
            label: 'Covers Today',
            value: '-',
            description: 'Guests served',
            color: 'text-blue-600',
          },
          {
            icon: Star,
            label: 'Popular Dish',
            value: '-',
            description: 'Most ordered',
            color: 'text-yellow-600',
          },
          {
            icon: ShoppingBag,
            label: 'Revenue Today',
            value: '-',
            description: 'Total sales',
            color: 'text-green-600',
          },
        ];

      case 'dentist':
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

      default:
        return [
          {
            icon: Calendar,
            label: `${t('appointmentPlural')} Today`,
            value: '-',
            description: 'Scheduled',
            color: 'text-blue-600',
          },
          {
            icon: Users,
            label: `Active ${t('customerPlural')}`,
            value: '-',
            description: 'Total clients',
            color: 'text-green-600',
          },
          {
            icon: DollarSign,
            label: 'Revenue This Month',
            value: '-',
            description: 'Total earnings',
            color: 'text-purple-600',
          },
          {
            icon: TrendingUp,
            label: 'Growth',
            value: '-',
            description: 'vs last month',
            color: 'text-orange-600',
          },
        ];
    }
  };

  const metrics = getTemplateMetrics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
    switch (templateType) {
      case 'hairdresser':
        return [
          { label: 'Add Walk-in', description: 'Quick appointment' },
          { label: 'View Portfolio', description: 'Style gallery' },
          { label: 'Popular Styles', description: 'Quick reference' },
          { label: 'Product Sales', description: 'Track retail' },
        ];

      case 'restaurant':
        return [
          { label: 'New Reservation', description: 'Book table' },
          { label: 'Walk-in Seating', description: 'Seat guests' },
          { label: 'Menu Management', description: 'Update dishes' },
          { label: 'Table Status', description: 'View availability' },
        ];

      case 'dentist':
        return [
          { label: `New ${t('customer')}`, description: 'Add patient' },
          { label: 'Write Prescription', description: 'Quick Rx' },
          { label: 'Emergency Slot', description: 'Urgent care' },
          { label: 'Lab Results', description: 'View reports' },
        ];

      default:
        return [
          { label: `New ${t('appointment')}`, description: 'Book now' },
          { label: `Add ${t('customer')}`, description: 'New client' },
          { label: 'View Schedule', description: 'Today\'s agenda' },
          { label: 'Reports', description: 'Analytics' },
        ];
    }
  };

  const actions = getQuickActions();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for your {template?.name.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    switch (templateType) {
      case 'hairdresser':
        return [
          '💡 Your most popular time slot is 2-4pm on Saturdays',
          '📊 Hair coloring services have increased 25% this month',
          '⭐ You have 5 new 5-star reviews this week!',
          '📅 Tomorrow has 3 openings - promote walk-in availability',
        ];

      case 'restaurant':
        return [
          '🍽️ Dinner service (6-8pm) is your busiest time',
          '📊 Weekend reservations are 90% booked',
          '⭐ Your signature dish has excellent reviews!',
          '📅 Consider offering a weekday lunch special',
        ];

      case 'dentist':
        return [
          '📋 12 patients due for 6-month checkups',
          '📊 Your practice is running 15% ahead of schedule today',
          '💊 3 prescription refills pending approval',
          '🎯 Follow-up compliance rate is 88%',
        ];

      default:
        return [
          `📊 You have ${Math.floor(Math.random() * 10) + 5} ${t('appointmentPlural').toLowerCase()} this week`,
          '⭐ Your business rating has improved to 4.8 stars',
          `💰 Revenue is up compared to last month`,
          '📅 Tomorrow has availability - consider promoting it',
        ];
    }
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
