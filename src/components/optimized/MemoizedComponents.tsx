import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Memoized Card component to prevent unnecessary re-renders
export const MemoizedCard = memo(Card);
export const MemoizedCardContent = memo(CardContent);
export const MemoizedCardHeader = memo(CardHeader);
export const MemoizedCardTitle = memo(CardTitle);

// Memoized UI components
export const MemoizedBadge = memo(Badge);
export const MemoizedButton = memo(Button);

// Memoized list item component
interface ListItemProps {
  title: string;
  description?: string;
  status?: string;
  onClick?: () => void;
}

export const MemoizedListItem = memo(({ title, description, status, onClick }: ListItemProps) => (
  <div className="flex items-center justify-between p-4 border-b border-dental-muted/20 hover:bg-dental-muted/5 transition-colors">
    <div className="flex-1">
      <h4 className="font-medium text-dental-foreground">{title}</h4>
      {description && (
        <p className="text-sm text-dental-muted-foreground mt-1">{description}</p>
      )}
    </div>
    <div className="flex items-center space-x-2">
      {status && <MemoizedBadge variant="outline">{status}</MemoizedBadge>}
      {onClick && (
        <MemoizedButton variant="ghost" size="sm" onClick={onClick}>
          View
        </MemoizedButton>
      )}
    </div>
  </div>
));

MemoizedListItem.displayName = 'MemoizedListItem';