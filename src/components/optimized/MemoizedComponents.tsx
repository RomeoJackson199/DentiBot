import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, URGENCY_COLORS } from '@/lib/constants';

// Memoized status badge component
export const StatusBadge = React.memo<{ status: string }>(({ status }) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft;
  
  return (
    <Badge className={colorClass}>
      {status}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized urgency badge component
export const UrgencyBadge = React.memo<{ urgency: string }>(({ urgency }) => {
  const colorClass = URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS] || URGENCY_COLORS.low;
  
  return (
    <Badge className={colorClass}>
      {urgency}
    </Badge>
  );
});

UrgencyBadge.displayName = 'UrgencyBadge';