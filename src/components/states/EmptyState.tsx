import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void };
  illustration?: React.ReactNode;
};

export function EmptyState({ title, description, primaryAction, illustration }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 flex flex-col items-center text-center gap-3">
        {illustration ?? (
          <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-[hsl(var(--brand-100))] text-[hsl(var(--brand-600))] flex items-center justify-center text-xl font-semibold">🙂</div>
        )}
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
        {primaryAction && (
          <Button className="mt-2" onClick={primaryAction.onClick}>{primaryAction.label}</Button>
        )}
      </CardContent>
    </Card>
  );
}

export default EmptyState;

